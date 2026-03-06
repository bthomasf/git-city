import "server-only";

import {
  fetchGroupProjects,
  fetchProjectCommits,
  fetchProjectIssues,
  fetchProjectMergeRequests,
  getConfiguredGitlabGroupIds,
  getConfiguredGitlabProjectIds,
} from "./gitlab";
import {
  getProjectIdsFromRegionsConfig,
  getRegionsConfigFromEnv,
} from "./gitlab-regions-config";

export type ActivityKind = "commit" | "merge_request" | "issue";

export interface GitlabActivityEvent {
  kind: ActivityKind;
  projectId: number;
  authorName: string;
  authorUsername?: string;
  createdAt: string;
  merged?: boolean;
  state?: string;
}

export interface ActivityWindow {
  since: string;
  until: string;
}

export interface SyncResult {
  window: ActivityWindow;
  events: GitlabActivityEvent[];
  projectIds: number[];
}

let lastSyncIso: string | null = null;

function toIso(d: Date): string {
  return d.toISOString();
}

async function withRetry<T>(fn: () => Promise<T>, label: string, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await fn();
    } catch (error) {
      lastError = error;
      // eslint-disable-next-line no-console
      console.warn(`[gitlab-sync] 第 ${i + 1} 次调用 ${label} 失败`, error);
    }
  }
  // eslint-disable-next-line no-console
  console.error(`[gitlab-sync] 多次调用 ${label} 仍然失败，放弃本轮。`, lastError);
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export function getLastSyncIso(): string | null {
  return lastSyncIso;
}

/**
 * 解析参与同步的项目 ID：若配置了 GITLAB_REGIONS_CONFIG_JSON 则从中取 projectIds；
 * 否则使用 GITLAB_PROJECT_IDS + GITLAB_GROUP_IDS 展开（兜底）。
 */
export async function getResolvedGitlabProjectIds(): Promise<number[]> {
  const regionsConfig = getRegionsConfigFromEnv();
  if (regionsConfig) {
    return getProjectIdsFromRegionsConfig(regionsConfig);
  }
  const explicitProjectIds = getConfiguredGitlabProjectIds();
  const groupIds = getConfiguredGitlabGroupIds();
  const projectIdSet = new Set<number>(explicitProjectIds);
  for (const gid of groupIds) {
    try {
      const projects = await withRetry(
        () => fetchGroupProjects(gid),
        `groups/${gid}/projects`,
      );
      for (const p of projects) projectIdSet.add(p.id);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`[gitlab-sync] 获取 Group ${gid} 项目列表失败，将忽略该 Group`, error);
    }
  }
  return Array.from(projectIdSet);
}

export async function runGitlabSyncJob(
  overrideWindow?: ActivityWindow,
): Promise<SyncResult> {
  const now = new Date();
  const sinceDate = overrideWindow
    ? new Date(overrideWindow.since)
    : lastSyncIso
      ? new Date(lastSyncIso)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const window: ActivityWindow = overrideWindow ?? {
    since: toIso(sinceDate),
    until: toIso(now),
  };

  const projectIds = await getResolvedGitlabProjectIds();
  if (projectIds.length === 0) {
    return { window, events: [], projectIds: [] };
  }

  const allEvents: GitlabActivityEvent[] = [];

  for (const projectId of projectIds) {
    // Commits
    const commits = await withRetry(
      () => fetchProjectCommits(projectId, window.since, window.until),
      `projects/${projectId}/repository/commits`,
    );
    for (const c of commits) {
      allEvents.push({
        kind: "commit",
        projectId,
        authorName: c.author_name,
        createdAt: c.created_at,
      });
    }

    // Merge Requests
    const mrs = await withRetry(
      () => fetchProjectMergeRequests(projectId, window.since, window.until),
      `projects/${projectId}/merge_requests`,
    );
    for (const mr of mrs) {
      allEvents.push({
        kind: "merge_request",
        projectId,
        authorName: mr.author.name,
        authorUsername: mr.author.username,
        createdAt: mr.created_at,
        merged: mr.merged_at != null,
        state: mr.state,
      });
    }

    // Issues
    const issues = await withRetry(
      () => fetchProjectIssues(projectId, window.since, window.until),
      `projects/${projectId}/issues`,
    );
    for (const issue of issues) {
      allEvents.push({
        kind: "issue",
        projectId,
        authorName: issue.author.name,
        authorUsername: issue.author.username,
        createdAt: issue.created_at,
        state: issue.state,
      });
    }
  }

  lastSyncIso = window.until;

  return { window, events: allEvents, projectIds };
}

