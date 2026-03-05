import type { AggregatedMetrics } from "./gitlab-metrics";
import type { DeveloperRecord } from "./github";
import { generateCityLayout } from "./github";

export function buildGitlabDevelopersFromMetrics(
  metrics: AggregatedMetrics,
): DeveloperRecord[] {
  const nowIso = new Date().toISOString();
  return metrics.members.map((m, index) => ({
    id: index + 1,
    github_login: m.key,
    github_id: null,
    name: m.name,
    avatar_url: null,
    bio: null,
    contributions: m.score,
    public_repos: m.projectIds.length,
    total_stars: 0,
    primary_language: null,
    top_repos: [],
    rank: index + 1,
    fetched_at: nowIso,
    created_at: nowIso,
    claimed: false,
    fetch_priority: 0,
    claimed_at: null,
    contribution_years: [],
    contributions_total: m.score,
    total_prs: m.mergeRequests,
    total_reviews: 0,
    total_issues: m.issues,
    repos_contributed_to: m.projectIds.length,
    followers: 0,
    following: 0,
    organizations_count: 0,
    account_created_at: nowIso,
    current_streak: 0,
    longest_streak: 0,
    active_days_last_year: 0,
    language_diversity: 0,
    xp_total: 0,
    xp_level: 1,
    xp_github: 0,
  }));
}

export function buildGitlabCityLayoutFromMetrics(
  metrics: AggregatedMetrics,
) {
  const devs = buildGitlabDevelopersFromMetrics(metrics);
  return generateCityLayout(devs);
}

