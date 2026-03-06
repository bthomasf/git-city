import { NextResponse } from "next/server";
import { runGitlabSyncJob } from "@/lib/gitlab-activity";
import { fetchProject } from "@/lib/gitlab";
import { aggregateGitlabActivities } from "@/lib/gitlab-metrics";
import { getRegionsConfigFromEnv } from "@/lib/gitlab-regions-config";
import { layoutRegionNeighborhoodBuildings } from "@/lib/gitlab-regions-layout";
import type { TeamCityBuilding } from "@/lib/gitlab-regions-layout";
import {
  getRegionNeighborhoodBuildings,
  type RegionNeighborhoodBuildingRow,
} from "@/lib/gitlab-regions-city";

const DEFAULT_RIVER = { x: -200, width: 40, length: 800, centerZ: 0 };

/**
 * GET /api/gitlab/city?days=30&filterUser=username
 * 返回「区域→小区→建筑」结构及 3D 布局；filterUser 存在时仅返回该用户在各区域各小区的楼。
 * 仅在配置了 GITLAB_REGIONS_CONFIG_JSON 时有效，否则返回 400。
 */
export async function GET(request: Request) {
  try {
    const config = getRegionsConfigFromEnv();
    if (!config) {
      return NextResponse.json(
        { error: "未配置区域-小区（GITLAB_REGIONS_CONFIG_JSON），请先配置后再使用本接口。" },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get("days");
    const untilParam = searchParams.get("until");
    const filterUser = searchParams.get("filterUser")?.trim() ?? null;

    const days = daysParam ? Number(daysParam) : 30;
    const now = untilParam ? new Date(untilParam) : new Date();
    const since = new Date(now.getTime() - Math.max(1, days) * 24 * 60 * 60 * 1000);

    const { window, events, projectIds } = await runGitlabSyncJob({
      since: since.toISOString(),
      until: now.toISOString(),
    });
    const metrics = aggregateGitlabActivities(window, events, projectIds);
    const rawRows = getRegionNeighborhoodBuildings(config, metrics, filterUser);
    const projectIdSet = new Set(rawRows.map((r) => r.projectId));
    const projectInfoMap = new Map<number, { name: string; pathWithNamespace: string }>();
    await Promise.all(
      Array.from(projectIdSet).map(async (pid) => {
        try {
          const project = await fetchProject(pid);
          projectInfoMap.set(pid, {
            name: project.name,
            pathWithNamespace: project.path_with_namespace,
          });
        } catch {
          // 解析失败时保留原字段，不阻断返回
        }
      }),
    );
    const buildingRows: RegionNeighborhoodBuildingRow[] = rawRows.map((r) => {
      const info = projectInfoMap.get(r.projectId);
      return {
        ...r,
        projectName: info?.name,
        pathWithNamespace: info?.pathWithNamespace,
      };
    });
    const buildings = layoutRegionNeighborhoodBuildings(buildingRows);
    const teamBuildings = buildings as TeamCityBuilding[];
    const regionLabels: { id: string; name: string; center: [number, number, number] }[] = [];
    const neighborhoodLabels: { id: string; name: string; regionId: string; center: [number, number, number] }[] = [];
    for (const region of config.regions) {
      const inRegion = teamBuildings.filter((b) => b.regionId === region.id);
      if (inRegion.length > 0) {
        const xs = inRegion.map((b) => b.position[0]);
        const zs = inRegion.map((b) => b.position[2]);
        regionLabels.push({
          id: region.id,
          name: region.name,
          center: [(Math.min(...xs) + Math.max(...xs)) / 2, 0, (Math.min(...zs) + Math.max(...zs)) / 2],
        });
      }
      for (const neighborhood of region.neighborhoods) {
        const inNb = teamBuildings.filter(
          (b) => b.regionId === region.id && b.neighborhoodId === neighborhood.id,
        );
        if (inNb.length > 0) {
          const xs = inNb.map((b) => b.position[0]);
          const zs = inNb.map((b) => b.position[2]);
          neighborhoodLabels.push({
            id: neighborhood.id,
            name: neighborhood.name,
            regionId: region.id,
            center: [(Math.min(...xs) + Math.max(...xs)) / 2, 0, (Math.min(...zs) + Math.max(...zs)) / 2],
          });
        }
      }
    }

    return NextResponse.json({
      window,
      regions: config.regions,
      buildingRows,
      layout: {
        buildings,
        plazas: [],
        decorations: [],
        river: DEFAULT_RIVER,
        bridges: [],
        regionLabels,
        neighborhoodLabels,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[gitlab-city] 城市数据失败", error);
    return NextResponse.json(
      { error: "获取团队城市数据失败，请检查服务器日志与配置。" },
      { status: 500 },
    );
  }
}
