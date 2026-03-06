import "server-only";

import { fetchProject } from "./gitlab";

/**
 * 区域-小区-楼配置：区域（业务线）→ 小区（项目）→ 楼（开发者）。
 * 支持 JSON 格式，可通过 GITLAB_REGIONS_CONFIG_JSON 加载。
 */

export interface NeighborhoodConfig {
  id: string;
  name: string;
  projectIds: number[];
}

export interface RegionConfig {
  id: string;
  name: string;
  neighborhoods: NeighborhoodConfig[];
}

export interface RegionsConfig {
  regions: RegionConfig[];
}

function isNeighborhoodConfig(x: unknown): x is NeighborhoodConfig {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.name !== "string") return false;
  if (!Array.isArray(o.projectIds)) return false;
  return o.projectIds.every((v) => typeof v === "number" && Number.isFinite(v) && v > 0);
}

function isRegionConfig(x: unknown): x is RegionConfig {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.name !== "string") return false;
  if (!Array.isArray(o.neighborhoods)) return false;
  return o.neighborhoods.every(isNeighborhoodConfig);
}

function isRegionsConfig(x: unknown): x is RegionsConfig {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (!Array.isArray(o.regions)) return false;
  return o.regions.every(isRegionConfig);
}

/**
 * 从 JSON 字符串解析区域-小区配置。
 * 校验：regions 非空、每区域有 id/name、每区域至少一个 neighborhood、每小区有 id/name 且 projectIds 至少一项。
 */
export function parseRegionsConfigJson(json: string): RegionsConfig {
  let data: unknown;
  try {
    data = JSON.parse(json) as unknown;
  } catch (e) {
    throw new Error(`区域-小区配置 JSON 解析失败: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (!isRegionsConfig(data)) {
    throw new Error(
      "区域-小区配置格式错误：需包含 regions 数组，每项含 id、name、neighborhoods；每小区含 id、name、projectIds（数字数组）"
    );
  }
  if (data.regions.length === 0) {
    throw new Error("区域-小区配置不能为空：regions 至少需要一项");
  }
  for (const r of data.regions) {
    if (r.neighborhoods.length === 0) {
      throw new Error(`区域 "${r.name}"(id=${r.id}) 下至少需要一个小区`);
    }
    for (const n of r.neighborhoods) {
      if (n.projectIds.length === 0) {
        throw new Error(`小区 "${n.name}"(id=${n.id}) 下至少需要一个项目 ID`);
      }
    }
  }
  return data;
}

/** 从环境变量 GITLAB_REGIONS_CONFIG_JSON 读取并解析配置；未设置则返回 null。 */
export function getRegionsConfigFromEnv(): RegionsConfig | null {
  const raw = process.env.GITLAB_REGIONS_CONFIG_JSON;
  if (!raw || raw.trim() === "") return null;
  return parseRegionsConfigJson(raw.trim());
}

/**
 * 是否使用区域-小区配置（已配置则同步与城市数据优先使用区域-小区模型）。
 */
export function hasRegionsConfig(): boolean {
  return getRegionsConfigFromEnv() != null;
}

/** 获取所有在区域-小区配置中出现的项目 ID（去重）。 */
export function getProjectIdsFromRegionsConfig(config: RegionsConfig): number[] {
  const set = new Set<number>();
  for (const r of config.regions) {
    for (const n of r.neighborhoods) {
      for (const pid of n.projectIds) set.add(pid);
    }
  }
  return Array.from(set);
}

export interface ValidateRegionsConfigResult {
  ok: boolean;
  errors?: string[];
}

/**
 * 可选：使用 GitLab API 校验配置中所有 projectId 是否可访问。
 * 失败时返回 { ok: false, errors: [...] }，成功返回 { ok: true }。
 */
export async function validateRegionsConfigWithGitlab(
  config: RegionsConfig,
): Promise<ValidateRegionsConfigResult> {
  const projectIds = getProjectIdsFromRegionsConfig(config);
  const errors: string[] = [];
  for (const projectId of projectIds) {
    try {
      await fetchProject(projectId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`项目 ${projectId} 不可访问或不存在: ${msg}`);
    }
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true };
}
