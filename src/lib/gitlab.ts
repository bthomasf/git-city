import "server-only";

type QueryValue = string | number | boolean | undefined | null;

const rawBaseUrl = process.env.GITLAB_BASE_URL ?? "";
const GITLAB_BASE_URL = rawBaseUrl.replace(/\/+$/, "");
const GITLAB_TOKEN = process.env.GITLAB_TOKEN ?? "";

if (!GITLAB_BASE_URL || !GITLAB_TOKEN) {
  // eslint-disable-next-line no-console
  console.warn(
    "[gitlab] GITLAB_BASE_URL 或 GITLAB_TOKEN 未配置，GitLab 同步功能将不可用。"
  );
}

export interface GitlabProject {
  id: number;
  name: string;
  path_with_namespace: string;
}

export interface GitlabCommit {
  id: string;
  short_id: string;
  title: string;
  author_name: string;
  author_email: string;
  created_at: string;
}

export interface GitlabMergeRequest {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  state: string;
  author: { id: number; username: string; name: string };
  merged_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GitlabIssue {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  state: string;
  author: { id: number; username: string; name: string };
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const normalizedPath = path.replace(/^\/+/, "");
  const url = new URL(
    `${GITLAB_BASE_URL}/api/v4/${normalizedPath}`
  );

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

export async function gitlabRequest<T>(
  path: string,
  options: RequestInit = {},
  query?: Record<string, QueryValue>,
): Promise<T> {
  if (!GITLAB_BASE_URL || !GITLAB_TOKEN) {
    throw new Error("GitLab 未正确配置，无法发起请求。");
  }

  const url = buildUrl(path, query);

  const res = await fetch(url, {
    ...options,
    headers: {
      "PRIVATE-TOKEN": GITLAB_TOKEN,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    // GitLab API 不需要缓存，保持每次请求新数据，由上层做缓存
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `GitLab API 请求失败: ${res.status} ${res.statusText} ${text ? `- ${text}` : ""}`.trim()
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return res.json() as Promise<T>;
}

export function getConfiguredGitlabGroupIds(): number[] {
  const raw = process.env.GITLAB_GROUP_IDS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((v) => parseInt(v.trim(), 10))
    .filter((n) => !Number.isNaN(n) && n > 0);
}

export function getConfiguredGitlabProjectIds(): number[] {
  const raw = process.env.GITLAB_PROJECT_IDS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((v) => parseInt(v.trim(), 10))
    .filter((n) => !Number.isNaN(n) && n > 0);
}

export async function fetchProject(projectId: number): Promise<GitlabProject> {
  return gitlabRequest<GitlabProject>(`projects/${projectId}`, { method: "GET" });
}

export async function fetchGroupProjects(groupId: number): Promise<GitlabProject[]> {
  return gitlabRequest<GitlabProject[]>(`groups/${groupId}/projects`, {
    method: "GET",
  }, {
    per_page: 100,
    include_subgroups: true,
  });
}

export async function fetchProjectCommits(
  projectId: number,
  sinceIso?: string,
  untilIso?: string,
): Promise<GitlabCommit[]> {
  return gitlabRequest<GitlabCommit[]>(`projects/${projectId}/repository/commits`, {
    method: "GET",
  }, {
    per_page: 100,
    since: sinceIso,
    until: untilIso,
  });
}

/**
 * 拉取某项目下指定作者的最新 commit，用于「点击楼层展示 commit」。
 */
export async function fetchProjectCommitsByAuthor(
  projectId: number,
  authorUsername: string,
  limit: number = 10,
  sinceIso?: string,
  untilIso?: string,
): Promise<GitlabCommit[]> {
  const commits = await gitlabRequest<GitlabCommit[]>(
    `projects/${projectId}/repository/commits`,
    { method: "GET" },
    {
      per_page: limit,
      author: authorUsername,
      since: sinceIso,
      until: untilIso,
    },
  );
  return commits;
}

export async function fetchProjectMergeRequests(
  projectId: number,
  updatedAfterIso?: string,
  updatedBeforeIso?: string,
): Promise<GitlabMergeRequest[]> {
  return gitlabRequest<GitlabMergeRequest[]>(`projects/${projectId}/merge_requests`, {
    method: "GET",
  }, {
    per_page: 100,
    updated_after: updatedAfterIso,
    updated_before: updatedBeforeIso,
    scope: "all",
  });
}

export async function fetchProjectIssues(
  projectId: number,
  updatedAfterIso?: string,
  updatedBeforeIso?: string,
): Promise<GitlabIssue[]> {
  return gitlabRequest<GitlabIssue[]>(`projects/${projectId}/issues`, {
    method: "GET",
  }, {
    per_page: 100,
    updated_after: updatedAfterIso,
    updated_before: updatedBeforeIso,
    scope: "all",
  });
}

