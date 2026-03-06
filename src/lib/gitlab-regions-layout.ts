import type { CityBuilding } from "./github";
import type { RegionNeighborhoodBuildingRow } from "./gitlab-regions-city";
import { applyVisualRules, getGitlabVisualRulesSync } from "./gitlab-visual-rules";

const LOT_W = 22;
const LOT_D = 18;
const ALLEY_W = 4;
const REGION_GAP = 80;
const NEIGHBORHOOD_GAP = 24;

/** 团队城市建筑：CityBuilding 兼容 + 区域/小区/项目/开发者元数据 */
export type TeamCityBuilding = CityBuilding & {
  regionId?: string;
  neighborhoodId?: string;
  projectId?: number;
  developerKey?: string;
};

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h >>> 0;
}

/**
 * 区域-小区-楼 2D 平面布局：按区域分块、每区域内小区块、每小区内多栋楼网格排列。
 * 输出与 CityBuilding 兼容的数组，并附带 regionId、neighborhoodId、projectId、developerKey。
 */
export function layoutRegionNeighborhoodBuildings(
  rows: RegionNeighborhoodBuildingRow[],
): TeamCityBuilding[] {
  const rules = getGitlabVisualRulesSync();
  const maxScore = rows.length > 0
    ? Math.max(...rows.map((r) => r.score), 1)
    : 1;
  const maxIndicatorValues = { height: maxScore, lit: maxScore };

  const buildings: TeamCityBuilding[] = [];
  let globalRank = 0;

  const byRegion = new Map<string, Map<string, RegionNeighborhoodBuildingRow[]>>();
  for (const r of rows) {
    let byNeighborhood = byRegion.get(r.regionId);
    if (!byNeighborhood) {
      byNeighborhood = new Map();
      byRegion.set(r.regionId, byNeighborhood);
    }
    const list = byNeighborhood.get(r.neighborhoodId) ?? [];
    list.push(r);
    byNeighborhood.set(r.neighborhoodId, list);
  }

  let maxRegionWidth = 0;
  for (const [, byNeighborhood] of byRegion) {
    let rw = 0;
    for (const [, list] of byNeighborhood) {
      const cols = Math.ceil(Math.sqrt(list.length));
      const rowsCount = Math.ceil(list.length / cols);
      const blockW = cols * LOT_W + (cols - 1) * ALLEY_W;
      rw = Math.max(rw, blockW);
    }
    maxRegionWidth = Math.max(maxRegionWidth, rw + REGION_GAP);
  }
  if (maxRegionWidth === 0) maxRegionWidth = REGION_GAP;

  let baseX = -(maxRegionWidth * (byRegion.size - 1)) / 2;
  let baseZ = 0;

  for (const [regionId, byNeighborhood] of byRegion) {
    for (const [neighborhoodId, list] of byNeighborhood) {
      const cols = Math.ceil(Math.sqrt(list.length));
      const rowsCount = Math.ceil(list.length / cols);
      const blockW = cols * LOT_W + (cols - 1) * ALLEY_W;
      const blockD = rowsCount * LOT_D + (rowsCount - 1) * ALLEY_W;
      const startX = baseX + LOT_W / 2;
      const startZ = baseZ + LOT_D / 2;
      for (let i = 0; i < list.length; i++) {
        const row = list[i];
        const col = i % cols;
        const rowIdx = Math.floor(i / cols);
        const posX = startX + col * (LOT_W + ALLEY_W);
        const posZ = startZ + rowIdx * (LOT_D + ALLEY_W);
        const { height, litPercentage } = applyVisualRules(
          {
            score: row.score,
            commits: row.commits,
            mergeRequests: row.mergeRequests,
            issues: row.issues,
          },
          rules,
          maxIndicatorValues,
        );
        const floorH = 6;
        const floors = Math.max(3, Math.floor(height / floorH));
        const seed = hashStr(`${row.regionId}:${row.neighborhoodId}:${row.projectId}:${row.developerKey}`);
        const w = Math.round(14 + seededRandom(seed) * 8);
        const d = Math.round(12 + seededRandom(seed + 99) * 8);
        globalRank += 1;
        buildings.push({
          login: row.developerKey,
          rank: globalRank,
          contributions: row.score,
          total_stars: 0,
          public_repos: 0,
          name: row.memberName,
          avatar_url: null,
          primary_language: null,
          claimed: false,
          owned_items: [],
          custom_color: null,
          billboard_images: [],
          achievements: [],
          kudos_count: 0,
          visit_count: 0,
          loadout: null,
          app_streak: 0,
          raid_xp: 0,
          current_week_contributions: 0,
          current_week_kudos_given: 0,
          current_week_kudos_received: 0,
          active_raid_tag: null,
          rabbit_completed: false,
          xp_total: 0,
          xp_level: 1,
          district: regionId,
          district_chosen: false,
          position: [posX, 0, posZ],
          width: w,
          depth: d,
          height,
          floors,
          windowsPerFloor: Math.max(3, Math.floor(w / 5)),
          sideWindowsPerFloor: Math.max(3, Math.floor(d / 5)),
          litPercentage,
          regionId,
          neighborhoodId,
          projectId: row.projectId,
          developerKey: row.developerKey,
        });
      }
      baseZ += blockD + NEIGHBORHOOD_GAP;
    }
    baseX += maxRegionWidth;
    baseZ = 0;
  }

  return buildings;
}
