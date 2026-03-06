import { NextResponse } from "next/server";
import { runGitlabSyncJob } from "@/lib/gitlab-activity";
import { aggregateGitlabActivities } from "@/lib/gitlab-metrics";
import { getRegionsConfigFromEnv } from "@/lib/gitlab-regions-config";
import { layoutRegionNeighborhoodBuildings } from "@/lib/gitlab-regions-layout";
import { getRegionNeighborhoodBuildings } from "@/lib/gitlab-regions-city";

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
    const buildingRows = getRegionNeighborhoodBuildings(config, metrics, filterUser);
    const buildings = layoutRegionNeighborhoodBuildings(buildingRows);

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
