type Locale = "zh-CN" | "en";

const zhCN: Record<string, string> = {
  "team.title": "团队 GitLab 城市",
  "team.subtitle": "聚合内网 GitLab 多 Group、多项目的代码活动，一眼看清团队整体的编码活跃度与协作关系。",
  "team.time.7d": "近 7 天",
  "team.time.30d": "近 30 天",
  "team.time.90d": "近 90 天",
  "team.search.placeholder": "输入 GitLab 用户名查看个人城市",
  "team.members.title": "团队成员",
  "team.members.score": "贡献度",
  "team.members.commits": "提交",
  "team.members.mr": "合并请求",
  "team.members.issue": "Issue",
  "team.collaboration.title": "协作关系（Top）",
  "team.collaboration.empty": "当前时间范围内协作关系较少。",
  "team.risk.title": "风险与健康度",
  "team.risk.inactive": "不活跃项目（仅配置但无活动）",
  "team.risk.busfactor": "Bus Factor 风险项目",
  "team.risk.none": "当前时间范围内未检测到明显风险。",
  "team.loading": "正在从 GitLab 加载团队活动数据…",
  "team.error": "加载失败，请检查 GitLab 配置或稍后重试。",
};

const bundles: Record<Locale, Record<string, string>> = {
  "zh-CN": zhCN,
  en: {},
};

const DEFAULT_LOCALE: Locale = "zh-CN";

export function t(key: string, locale: Locale = DEFAULT_LOCALE): string {
  const bundle = bundles[locale] ?? bundles[DEFAULT_LOCALE];
  return bundle[key] ?? key;
}

