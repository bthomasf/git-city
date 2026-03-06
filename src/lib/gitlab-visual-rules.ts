import "server-only";

/**
 * 团队城市建筑视觉规则配置（JSON）：建筑高度、窗户亮灯与贡献指标的映射。
 * 可通过 GITLAB_VISUAL_RULES_JSON 或 GITLAB_VISUAL_RULES_URL 加载，缺失时使用内置默认。
 */

export type VisualIndicator = "score" | "commits" | "mergeRequests" | "issues";

export interface HeightRule {
  /** 用于计算高度的指标 */
  indicator: VisualIndicator;
  /** 最小建筑高度 */
  minHeight: number;
  /** 最大建筑高度 */
  maxHeight: number;
  /** 指标归一化时使用的上限（超过按此值计） */
  maxIndicatorValue: number;
}

export interface LitPercentageRule {
  indicator: VisualIndicator;
  /** 最小亮窗比例 0–1 */
  minLit: number;
  /** 最大亮窗比例 0–1 */
  maxLit: number;
  maxIndicatorValue: number;
}

export interface GitlabVisualRulesConfig {
  height: HeightRule;
  litPercentage: LitPercentageRule;
}

const DEFAULT_VISUAL_RULES: GitlabVisualRulesConfig = {
  height: {
    indicator: "score",
    minHeight: 35,
    maxHeight: 600,
    maxIndicatorValue: 5000,
  },
  litPercentage: {
    indicator: "score",
    minLit: 0.2,
    maxLit: 0.9,
    maxIndicatorValue: 5000,
  },
};

function getIndicatorValue(
  row: { score: number; commits: number; mergeRequests: number; issues: number },
  indicator: VisualIndicator,
): number {
  switch (indicator) {
    case "score":
      return row.score;
    case "commits":
      return row.commits;
    case "mergeRequests":
      return row.mergeRequests;
    case "issues":
      return row.issues;
    default:
      return row.score;
  }
}

function isHeightRule(x: unknown): x is HeightRule {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    (o.indicator === "score" || o.indicator === "commits" || o.indicator === "mergeRequests" || o.indicator === "issues") &&
    typeof o.minHeight === "number" &&
    typeof o.maxHeight === "number" &&
    typeof o.maxIndicatorValue === "number" &&
    o.minHeight >= 0 &&
    o.maxHeight >= o.minHeight &&
    o.maxIndicatorValue > 0
  );
}

function isLitPercentageRule(x: unknown): x is LitPercentageRule {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    (o.indicator === "score" || o.indicator === "commits" || o.indicator === "mergeRequests" || o.indicator === "issues") &&
    typeof o.minLit === "number" &&
    typeof o.maxLit === "number" &&
    typeof o.maxIndicatorValue === "number" &&
    o.minLit >= 0 &&
    o.minLit <= 1 &&
    o.maxLit >= o.minLit &&
    o.maxLit <= 1 &&
    o.maxIndicatorValue > 0
  );
}

function isVisualRulesConfig(x: unknown): x is GitlabVisualRulesConfig {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return isHeightRule(o.height) && isLitPercentageRule(o.litPercentage);
}

export function parseVisualRulesJson(json: string): GitlabVisualRulesConfig {
  let data: unknown;
  try {
    data = JSON.parse(json) as unknown;
  } catch (e) {
    throw new Error(`视觉规则 JSON 解析失败: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (!isVisualRulesConfig(data)) {
    throw new Error(
      "视觉规则格式错误：需包含 height 与 litPercentage，各含 indicator、min/max、maxIndicatorValue"
    );
  }
  return data;
}

let cachedRules: GitlabVisualRulesConfig | null = null;

/**
 * 加载视觉规则：优先 GITLAB_VISUAL_RULES_JSON，其次 GITLAB_VISUAL_RULES_URL（GET 取 JSON），
 * 无效或未配置则返回内置默认。结果在进程内缓存。
 */
export async function getGitlabVisualRules(): Promise<GitlabVisualRulesConfig> {
  if (cachedRules) return cachedRules;
  const raw = process.env.GITLAB_VISUAL_RULES_JSON;
  if (raw && raw.trim() !== "") {
    try {
      cachedRules = parseVisualRulesJson(raw.trim());
      return cachedRules;
    } catch {
      // fallback to default
    }
  }
  const url = process.env.GITLAB_VISUAL_RULES_URL;
  if (url && url.trim() !== "") {
    try {
      const res = await fetch(url.trim(), { cache: "no-store" });
      if (res.ok) {
        const text = await res.text();
        cachedRules = parseVisualRulesJson(text);
        return cachedRules;
      }
    } catch {
      // fallback to default
    }
  }
  cachedRules = DEFAULT_VISUAL_RULES;
  return cachedRules;
}

/** 同步版：仅读 GITLAB_VISUAL_RULES_JSON，不请求 URL；未配置则返回默认。用于不能 async 的路径。 */
export function getGitlabVisualRulesSync(): GitlabVisualRulesConfig {
  if (cachedRules) return cachedRules;
  const raw = process.env.GITLAB_VISUAL_RULES_JSON;
  if (raw && raw.trim() !== "") {
    try {
      cachedRules = parseVisualRulesJson(raw.trim());
      return cachedRules;
    } catch {
      // fallback
    }
  }
  return DEFAULT_VISUAL_RULES;
}

export interface BuildingMetrics {
  score: number;
  commits: number;
  mergeRequests: number;
  issues: number;
}

/**
 * 根据视觉规则计算单栋楼的高度与亮窗比例。
 * maxIndicatorValues 可由调用方根据当前数据集计算，若不传则使用规则内的 maxIndicatorValue。
 */
export function applyVisualRules(
  row: BuildingMetrics,
  rules: GitlabVisualRulesConfig,
  maxIndicatorValues?: { height: number; lit: number },
): { height: number; litPercentage: number } {
  const heightRule = rules.height;
  const litRule = rules.litPercentage;
  const maxH = maxIndicatorValues?.height ?? heightRule.maxIndicatorValue;
  const maxL = maxIndicatorValues?.lit ?? litRule.maxIndicatorValue;
  const rawH = getIndicatorValue(row, heightRule.indicator);
  const rawL = getIndicatorValue(row, litRule.indicator);
  const normH = Math.min(1, rawH / Math.max(1, maxH));
  const normL = Math.min(1, rawL / Math.max(1, maxL));
  const height = heightRule.minHeight + normH * (heightRule.maxHeight - heightRule.minHeight);
  const litPercentage = litRule.minLit + normL * (litRule.maxLit - litRule.minLit);
  return { height, litPercentage };
}
