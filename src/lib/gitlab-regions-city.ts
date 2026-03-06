import type { AggregatedMetrics, ProjectMemberMetric } from "./gitlab-metrics";
import type { RegionsConfig } from "./gitlab-regions-config";

/**
 * 单栋楼数据：对应一个 (区域, 小区, 项目, 开发者)，用于区域-小区-楼视图与 API。
 */
export interface RegionNeighborhoodBuildingRow {
  regionId: string;
  regionName: string;
  neighborhoodId: string;
  neighborhoodName: string;
  projectId: number;
  developerKey: string;
  memberName: string;
  score: number;
  commits: number;
  mergeRequests: number;
  issues: number;
}

const rowKey = (r: RegionNeighborhoodBuildingRow) =>
  `${r.regionId}:${r.neighborhoodId}:${r.projectId}:${r.developerKey}`;

/**
 * 根据区域-小区配置与聚合指标，生成「区域→小区→楼」建筑列表。
 * 仅包含配置中存在的 (region, neighborhood, projectId)，且在该 project 有贡献的 developer。
 * 若传 filterUser，则只返回该用户在各区域各小区的楼。
 */
export function getRegionNeighborhoodBuildings(
  config: RegionsConfig,
  metrics: AggregatedMetrics,
  filterUser?: string | null,
): RegionNeighborhoodBuildingRow[] {
  const pmByProject = new Map<number, ProjectMemberMetric[]>();
  for (const pm of metrics.projectMemberMetrics) {
    const list = pmByProject.get(pm.projectId) ?? [];
    list.push(pm);
    pmByProject.set(pm.projectId, list);
  }

  const rows: RegionNeighborhoodBuildingRow[] = [];
  for (const region of config.regions) {
    for (const neighborhood of region.neighborhoods) {
      for (const projectId of neighborhood.projectIds) {
        const list = pmByProject.get(projectId) ?? [];
        for (const pm of list) {
          if (filterUser != null && filterUser !== "" && pm.memberKey !== filterUser) continue;
          rows.push({
            regionId: region.id,
            regionName: region.name,
            neighborhoodId: neighborhood.id,
            neighborhoodName: neighborhood.name,
            projectId: pm.projectId,
            developerKey: pm.memberKey,
            memberName: pm.memberName,
            score: pm.score,
            commits: pm.commits,
            mergeRequests: pm.mergeRequests,
            issues: pm.issues,
          });
        }
      }
    }
  }
  rows.sort((a, b) => {
    const keyA = rowKey(a);
    const keyB = rowKey(b);
    if (keyA !== keyB) return keyA.localeCompare(keyB);
    return 0;
  });
  return rows;
}
