import "server-only";

import type { ActivityWindow, GitlabActivityEvent } from "./gitlab-activity";

type BehaviorKind = "commit" | "merge_request" | "issue";

interface BehaviorWeights {
  commit: number;
  merge_request: number;
  issue: number;
}

export interface MemberAggregate {
  key: string;
  name: string;
  score: number;
  commits: number;
  mergeRequests: number;
  issues: number;
  projectIds: number[];
}

export interface ProjectAggregate {
  id: number;
  score: number;
  commits: number;
  mergeRequests: number;
  issues: number;
  memberKeys: string[];
}

export interface CollaborationEdge {
  from: string;
  to: string;
  score: number;
}

export interface BusFactorProjectRisk {
  projectId: number;
  primaryMemberKey: string;
  ratio: number;
}

export interface RiskSummary {
  inactiveProjectIds: number[];
  busFactorProjects: BusFactorProjectRisk[];
}

export interface AggregatedMetrics {
  window: ActivityWindow;
  members: MemberAggregate[];
  projects: ProjectAggregate[];
  collaborations: CollaborationEdge[];
  risks: RiskSummary;
}

function parseNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function getBehaviorWeights(): BehaviorWeights {
  return {
    commit: parseNumberEnv("GITLAB_WEIGHT_COMMIT", 1),
    merge_request: parseNumberEnv("GITLAB_WEIGHT_MR", 3),
    issue: parseNumberEnv("GITLAB_WEIGHT_ISSUE", 0.5),
  };
}

function getProjectWeightMap(): Map<number, number> {
  const raw = process.env.GITLAB_PROJECT_WEIGHTS;
  const map = new Map<number, number>();
  if (!raw) return map;

  const entries = raw.split(",");
  for (const entry of entries) {
    const [idPart, weightPart] = entry.split("=").map((v) => v.trim());
    const id = Number(idPart);
    const weight = Number(weightPart);
    if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(weight) || weight <= 0) {
      // eslint-disable-next-line no-console
      console.warn("[gitlab-metrics] 无法解析项目权重配置项：", entry);
      continue;
    }
    map.set(id, weight);
  }
  return map;
}

function getBusFactorThreshold(): number {
  const raw = process.env.GITLAB_BUS_FACTOR_THRESHOLD;
  if (!raw) return 0.8;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 && n < 1 ? n : 0.8;
}

export function aggregateGitlabActivities(
  window: ActivityWindow,
  events: GitlabActivityEvent[],
  configuredProjectIds: number[],
): AggregatedMetrics {
  const behaviorWeights = getBehaviorWeights();
  const projectWeights = getProjectWeightMap();
  const busFactorThreshold = getBusFactorThreshold();

  const memberMap = new Map<string, MemberAggregate & { projectSet: Set<number> }>();
  const projectMap = new Map<number, ProjectAggregate & { memberSet: Set<string> }>();
  const projectMemberEventCounts = new Map<number, Map<string, number>>();

  for (const e of events) {
    const kind = e.kind as BehaviorKind;
    const behaviorWeight = behaviorWeights[kind] ?? 1;
    const projectWeight = projectWeights.get(e.projectId) ?? 1;
    const scoreDelta = behaviorWeight * projectWeight;

    const memberKey = e.authorUsername && e.authorUsername.trim().length > 0
      ? e.authorUsername
      : e.authorName;

    if (!memberKey) continue;

    let member = memberMap.get(memberKey);
    if (!member) {
      member = {
        key: memberKey,
        name: e.authorName,
        score: 0,
        commits: 0,
        mergeRequests: 0,
        issues: 0,
        projectIds: [],
        projectSet: new Set<number>(),
      };
      memberMap.set(memberKey, member);
    }

    member.score += scoreDelta;
    member.projectSet.add(e.projectId);

    if (kind === "commit") member.commits += 1;
    if (kind === "merge_request") member.mergeRequests += 1;
    if (kind === "issue") member.issues += 1;

    let project = projectMap.get(e.projectId);
    if (!project) {
      project = {
        id: e.projectId,
        score: 0,
        commits: 0,
        mergeRequests: 0,
        issues: 0,
        memberKeys: [],
        memberSet: new Set<string>(),
      };
      projectMap.set(e.projectId, project);
    }

    project.score += scoreDelta;
    project.memberSet.add(memberKey);

    if (kind === "commit") project.commits += 1;
    if (kind === "merge_request") project.mergeRequests += 1;
    if (kind === "issue") project.issues += 1;

    let memberCounts = projectMemberEventCounts.get(e.projectId);
    if (!memberCounts) {
      memberCounts = new Map<string, number>();
      projectMemberEventCounts.set(e.projectId, memberCounts);
    }
    memberCounts.set(memberKey, (memberCounts.get(memberKey) ?? 0) + 1);
  }

  const members: MemberAggregate[] = [];
  for (const m of memberMap.values()) {
    members.push({
      key: m.key,
      name: m.name,
      score: m.score,
      commits: m.commits,
      mergeRequests: m.mergeRequests,
      issues: m.issues,
      projectIds: Array.from(m.projectSet),
    });
  }

  const projects: ProjectAggregate[] = [];
  for (const p of projectMap.values()) {
    projects.push({
      id: p.id,
      score: p.score,
      commits: p.commits,
      mergeRequests: p.mergeRequests,
      issues: p.issues,
      memberKeys: Array.from(p.memberSet),
    });
  }

  const collaborationsMap = new Map<string, number>();
  for (const proj of projects) {
    const membersInProject = proj.memberKeys;
    if (membersInProject.length < 2) continue;
    for (let i = 0; i < membersInProject.length; i++) {
      for (let j = i + 1; j < membersInProject.length; j++) {
        const a = membersInProject[i];
        const b = membersInProject[j];
        const key = a < b ? `${a}::${b}` : `${b}::${a}`;
        const existing = collaborationsMap.get(key) ?? 0;
        collaborationsMap.set(key, existing + proj.score);
      }
    }
  }

  const collaborations: CollaborationEdge[] = [];
  for (const [key, score] of collaborationsMap.entries()) {
    const [a, b] = key.split("::");
    collaborations.push({ from: a, to: b, score });
  }

  const inactiveProjectIds: number[] = [];
  for (const pid of configuredProjectIds) {
    if (!projectMap.has(pid)) {
      inactiveProjectIds.push(pid);
    }
  }

  const busFactorProjects: BusFactorProjectRisk[] = [];
  for (const [projectId, memberCounts] of projectMemberEventCounts.entries()) {
    let total = 0;
    for (const v of memberCounts.values()) total += v;
    if (total === 0) continue;
    let primaryKey = "";
    let primaryCount = 0;
    for (const [k, v] of memberCounts.entries()) {
      if (v > primaryCount) {
        primaryCount = v;
        primaryKey = k;
      }
    }
    const ratio = primaryCount / total;
    if (ratio >= busFactorThreshold) {
      busFactorProjects.push({
        projectId,
        primaryMemberKey: primaryKey,
        ratio,
      });
    }
  }

  members.sort((a, b) => b.score - a.score);
  projects.sort((a, b) => b.score - a.score);
  collaborations.sort((a, b) => b.score - a.score);

  return {
    window,
    members,
    projects,
    collaborations,
    risks: {
      inactiveProjectIds,
      busFactorProjects,
    },
  };
}

