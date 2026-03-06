"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { CityBuilding, CityPlaza, CityDecoration, CityRiver, CityBridge } from "@/lib/github";
import type { AggregatedMetrics, CollaborationEdge, RiskSummary, MemberAggregate } from "@/lib/gitlab-metrics";
import type { TeamCityBuilding } from "@/lib/gitlab-regions-layout";
import { buildGitlabCityLayoutFromMetrics } from "@/lib/gitlab-city";
import { t } from "@/lib/i18n";

const CityCanvas = dynamic(() => import("@/components/CityCanvas"), {
  ssr: false,
});

/** 区域-小区模式下单栋楼一行数据 */
interface BuildingRow {
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

interface TeamCityState {
  metrics: AggregatedMetrics | null;
  buildings: CityBuilding[];
  plazas: CityPlaza[];
  decorations: CityDecoration[];
  river: CityRiver | null;
  bridges: CityBridge[];
  /** 区域-小区模式时存在 */
  regions?: { id: string; name: string; neighborhoods: { id: string; name: string; projectIds: number[] }[] }[];
  /** 区域-小区模式时的楼栋行数据，用于派生成员列表 */
  buildingRows?: BuildingRow[];
}

interface GitlabCommitItem {
  id: string;
  short_id: string;
  title: string;
  author_name: string;
  created_at: string;
  web_url?: string | null;
}

export default function TeamGitlabCityPage() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<TeamCityState | null>(null);
  const [focusedLogin, setFocusedLogin] = useState<string | null>(null);
  const [filterUser, setFilterUser] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [useRegionsApi, setUseRegionsApi] = useState<boolean | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<{ projectId: number; developerKey: string } | null>(null);
  const [commits, setCommits] = useState<GitlabCommitItem[]>([]);
  const [commitsLoading, setCommitsLoading] = useState(false);

  const loadCity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cityRes = await fetch(
        `/api/gitlab/city?days=${days}${filterUser ? `&filterUser=${encodeURIComponent(filterUser)}` : ""}`,
        { cache: "no-store" },
      );
      if (cityRes.ok) {
        const cityJson = (await cityRes.json()) as {
          window: { since: string; until: string };
          regions: { id: string; name: string; neighborhoods: { id: string; name: string; projectIds: number[] }[] }[];
          buildingRows: BuildingRow[];
          layout: { buildings: CityBuilding[]; plazas: CityPlaza[]; decorations: CityDecoration[]; river: CityRiver; bridges: CityBridge[] };
        };
        setState({
          metrics: null,
          buildings: cityJson.layout.buildings,
          plazas: cityJson.layout.plazas,
          decorations: cityJson.layout.decorations,
          river: cityJson.layout.river,
          bridges: cityJson.layout.bridges,
          regions: cityJson.regions,
          buildingRows: cityJson.buildingRows ?? [],
        });
        setUseRegionsApi(true);
        setLoading(false);
        return;
      }
      setUseRegionsApi(false);
    } catch {
      setUseRegionsApi(false);
    }
    try {
      const syncRes = await fetch(`/api/gitlab/sync?days=${days}`, { cache: "no-store" });
      if (!syncRes.ok) throw new Error(`HTTP ${syncRes.status}`);
      const json = (await syncRes.json()) as AggregatedMetrics;
      const layout = buildGitlabCityLayoutFromMetrics(json);
      setState({
        metrics: json,
        buildings: layout.buildings,
        plazas: layout.plazas,
        decorations: layout.decorations,
        river: layout.river,
        bridges: layout.bridges,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[team-gitlab-city] 加载失败", e);
      setError(t("team.error"));
    } finally {
      setLoading(false);
    }
  }, [days, filterUser]);

  useEffect(() => {
    let cancelled = false;
    void loadCity().then(() => {
      if (!cancelled) setFocusedLogin(filterUser);
    });
    return () => {
      cancelled = true;
    };
  }, [loadCity, filterUser]);

  const members = useMemo<MemberAggregate[]>(() => state?.metrics?.members ?? [], [state]);

  /** 区域-小区模式下从 buildingRows 聚合出的成员列表（与 MemberAggregate 结构兼容） */
  const regionMembers = useMemo<MemberAggregate[]>(() => {
    const rows = state?.buildingRows ?? [];
    if (rows.length === 0) return [];
    const map = new Map<string, MemberAggregate>();
    for (const r of rows) {
      const existing = map.get(r.developerKey);
      if (existing) {
        existing.score += r.score;
        existing.commits += r.commits;
        existing.mergeRequests += r.mergeRequests;
        existing.issues += r.issues;
        if (!existing.projectIds.includes(r.projectId)) existing.projectIds.push(r.projectId);
      } else {
        map.set(r.developerKey, {
          key: r.developerKey,
          name: r.memberName,
          score: r.score,
          commits: r.commits,
          mergeRequests: r.mergeRequests,
          issues: r.issues,
          projectIds: [r.projectId],
        });
      }
    }
    const list = Array.from(map.values());
    list.sort((a, b) => b.score - a.score);
    return list;
  }, [state?.buildingRows]);

  const membersToShow = useRegionsApi && state?.buildingRows?.length ? regionMembers : members;
  const collaborations = useMemo<CollaborationEdge[]>(() => state?.metrics?.collaborations ?? [], [state]);
  const risks = useMemo<RiskSummary | null>(() => state?.metrics?.risks ?? null, [state]);

  const selectedMember = useMemo(
    () => membersToShow.find((m) => m.key === focusedLogin) ?? null,
    [membersToShow, focusedLogin],
  );

  const topCollaborations = useMemo(() => {
    if (!focusedLogin) return collaborations.slice(0, 10);
    return collaborations
      .filter((c) => c.from === focusedLogin || c.to === focusedLogin)
      .slice(0, 10);
  }, [collaborations, focusedLogin]);

  const handleMemberClick = (m: MemberAggregate | { key: string; name: string }) => {
    setFocusedLogin(m.key);
  };

  const handleSearchSubmit = () => {
    const v = searchInput.trim() || null;
    setFilterUser(v);
  };

  const handleBuildingClick = useCallback((b: CityBuilding) => {
    setFocusedLogin(b.login);
    const tb = b as TeamCityBuilding;
    if (tb.projectId != null && tb.developerKey != null) {
      setSelectedBuilding({ projectId: tb.projectId, developerKey: tb.developerKey });
      setCommitsLoading(true);
      setCommits([]);
      fetch(
        `/api/gitlab/commits?projectId=${tb.projectId}&username=${encodeURIComponent(tb.developerKey)}&limit=10`,
      )
        .then((r) => r.json())
        .then((data: { commits?: GitlabCommitItem[] }) => {
          setCommits(data.commits ?? []);
        })
        .catch(() => setCommits([]))
        .finally(() => setCommitsLoading(false));
    } else {
      setSelectedBuilding(null);
      setCommits([]);
    }
  }, []);

  const accentColor = "#6090e0";

  return (
    <div className="relative min-h-screen bg-bg text-cream">
      <div className="pointer-events-none fixed inset-0">
        {state && state.river && (
          <CityCanvas
            buildings={state.buildings}
            plazas={state.plazas}
            decorations={state.decorations}
            river={state.river}
            bridges={state.bridges}
            flyMode={false}
            flyVehicle="plane"
            onExitFly={() => {}}
            themeIndex={0}
            focusedBuilding={focusedLogin}
            accentColor={accentColor}
            onBuildingClick={handleBuildingClick}
            onFocusInfo={() => {}}
          />
        )}
      </div>

      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-black/20 via-black/5 to-black/40" />

      <button
        type="button"
        onClick={() => setPanelCollapsed((v) => !v)}
        className="pointer-events-auto fixed bottom-4 right-4 z-20 rounded-full border border-border bg-bg-raised/80 px-3 py-1.5 text-[11px] normal-case backdrop-blur"
      >
        {panelCollapsed ? t("team.panel.expand") : t("team.panel.collapse")}
      </button>

      {!panelCollapsed && (
      <div className="relative z-10 flex h-screen flex-col">
        <header className="pointer-events-auto mx-auto mt-6 w-full max-w-5xl rounded-xl border border-border bg-bg-raised/70 px-5 py-4 backdrop-blur">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-semibold normal-case">{t("team.title")}</h1>
              <p className="mt-1 text-xs text-muted normal-case">
                {t("team.subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDays(7)}
                className={`rounded-full px-3 py-1 text-[11px] normal-case border ${
                  days === 7 ? "border-cream bg-cream/10" : "border-border text-muted"
                }`}
              >
                {t("team.time.7d")}
              </button>
              <button
                type="button"
                onClick={() => setDays(30)}
                className={`rounded-full px-3 py-1 text-[11px] normal-case border ${
                  days === 30 ? "border-cream bg-cream/10" : "border-border text-muted"
                }`}
              >
                {t("team.time.30d")}
              </button>
              <button
                type="button"
                onClick={() => setDays(90)}
                className={`rounded-full px-3 py-1 text-[11px] normal-case border ${
                  days === 90 ? "border-cream bg-cream/10" : "border-border text-muted"
                }`}
              >
                {t("team.time.90d")}
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder={t("team.search.placeholder")}
                className="w-full rounded-md border border-border bg-bg px-3 py-1.5 text-[11px] outline-none placeholder:text-muted sm:max-w-[200px]"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
              />
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="rounded-md border border-border bg-bg px-3 py-1.5 text-[11px] normal-case"
              >
                {t("team.search.button")}
              </button>
              {useRegionsApi && filterUser && (
                <button
                  type="button"
                  onClick={() => { setFilterUser(null); setSearchInput(""); }}
                  className="rounded-md border border-border bg-bg px-3 py-1.5 text-[11px] normal-case text-muted"
                >
                  {t("team.search.clear")}
                </button>
              )}
            </div>
            {loading && (
              <p className="text-[11px] text-muted normal-case">{t("team.loading")}</p>
            )}
            {error && !loading && (
              <p className="text-[11px] text-red-400 normal-case">{error}</p>
            )}
          </div>
        </header>

        <main className="pointer-events-none mx-auto mt-4 flex w-full max-w-5xl flex-1 gap-4 px-3 pb-4">
          <section className="pointer-events-auto flex-1 overflow-hidden rounded-xl border border-border bg-bg-raised/70 p-3 backdrop-blur">
            <h2 className="mb-2 text-xs font-semibold normal-case">{t("team.members.title")}</h2>
            <div className="max-h-[60vh] overflow-auto pr-1">
              {membersToShow.length > 0 ? (
              <table className="w-full border-collapse text-[11px]">
                <thead className="sticky top-0 bg-bg-raised">
                  <tr className="text-muted">
                    <th className="px-2 py-1 text-left font-normal">#</th>
                    <th className="px-2 py-1 text-left font-normal">{t("team.members.user")}</th>
                    <th className="px-2 py-1 text-right font-normal">{t("team.members.score")}</th>
                    <th className="px-2 py-1 text-right font-normal">{t("team.members.commits")}</th>
                    <th className="px-2 py-1 text-right font-normal">{t("team.members.mr")}</th>
                    <th className="px-2 py-1 text-right font-normal">{t("team.members.issue")}</th>
                  </tr>
                </thead>
                <tbody>
                  {membersToShow.map((m, idx) => (
                    <tr
                      key={m.key}
                      className={`cursor-pointer border-t border-border/40 hover:bg-bg/80 ${
                        focusedLogin === m.key ? "bg-bg/80" : ""
                      }`}
                      onClick={() => handleMemberClick(m)}
                    >
                      <td className="px-2 py-1 text-muted">{idx + 1}</td>
                      <td className="px-2 py-1">{m.name || m.key}</td>
                      <td className="px-2 py-1 text-right">{m.score.toFixed(1)}</td>
                      <td className="px-2 py-1 text-right">{m.commits}</td>
                      <td className="px-2 py-1 text-right">{m.mergeRequests}</td>
                      <td className="px-2 py-1 text-right">{m.issues}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              ) : (
                <p className="text-[11px] text-muted normal-case">{t("team.regionsMode")}</p>
              )}
            </div>
          </section>

          <aside className="pointer-events-auto flex w-[260px] flex-col gap-3">
            {selectedBuilding && (
              <div className="rounded-xl border border-border bg-bg-raised/70 p-3 backdrop-blur">
                <h2 className="mb-2 text-xs font-semibold normal-case">{t("team.commits.title")}</h2>
                <p className="mb-1 text-[11px] text-muted normal-case">
                  {selectedBuilding.developerKey} · {t("team.commits.project")} #{selectedBuilding.projectId}
                </p>
                {commitsLoading ? (
                  <p className="text-[11px] text-muted normal-case">{t("team.loading")}</p>
                ) : commits.length === 0 ? (
                  <p className="text-[11px] text-muted normal-case">{t("team.commits.empty")}</p>
                ) : (
                  <ul className="max-h-[200px] space-y-1 overflow-auto text-[11px]">
                    {commits.map((c) => (
                      <li key={c.id} className="border-t border-border/40 pt-1">
                        {c.web_url ? (
                          <a
                            href={c.web_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block font-medium truncate text-cream underline decoration-muted hover:decoration-cream"
                            title={t("team.commits.openInGitlab")}
                          >
                            {c.title}
                          </a>
                        ) : (
                          <div className="font-medium truncate" title={c.title}>{c.title}</div>
                        )}
                        <div className="text-muted">{new Date(c.created_at).toLocaleString("zh-CN")}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="rounded-xl border border-border bg-bg-raised/70 p-3 backdrop-blur">
              <h2 className="mb-2 text-xs font-semibold normal-case">
                {selectedMember ? (selectedMember.name || selectedMember.key) : t("team.collaboration.title")}
              </h2>
              {selectedMember && (
                <div className="mb-2 text-[11px] text-muted normal-case">
                  <div>Score: {selectedMember.score.toFixed(1)}</div>
                  <div>
                    {t("team.members.commits")}: {selectedMember.commits} · {t("team.members.mr")}: {selectedMember.mergeRequests} · {t("team.members.issue")}: {selectedMember.issues}
                  </div>
                  <div>Projects: {selectedMember.projectIds.length}</div>
                </div>
              )}
              <h3 className="mb-1 text-[11px] font-normal text-muted normal-case">{t("team.collaboration.title")}</h3>
              {topCollaborations.length === 0 ? (
                <p className="text-[11px] text-muted normal-case">
                  {t("team.collaboration.empty")}
                </p>
              ) : (
                <ul className="space-y-1 text-[11px]">
                  {topCollaborations.map((c) => (
                    <li key={`${c.from}-${c.to}`} className="flex justify-between">
                      <span className="truncate">
                        {c.from} ↔ {c.to}
                      </span>
                      <span className="text-muted">{c.score.toFixed(1)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {state?.metrics && (
            <div className="rounded-xl border border-border bg-bg-raised/70 p-3 backdrop-blur">
              <h2 className="mb-2 text-xs font-semibold normal-case">{t("team.risk.title")}</h2>
              {!risks || (risks.inactiveProjectIds.length === 0 && risks.busFactorProjects.length === 0) ? (
                <p className="text-[11px] text-muted normal-case">{t("team.risk.none")}</p>
              ) : (
                <div className="space-y-2 text-[11px]">
                  {risks.inactiveProjectIds.length > 0 && (
                    <div>
                      <div className="mb-1 font-normal text-muted normal-case">{t("team.risk.inactive")}</div>
                      <ul className="space-y-0.5">
                        {risks.inactiveProjectIds.map((id) => (
                          <li key={id}>Project #{id}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {risks.busFactorProjects.length > 0 && (
                    <div>
                      <div className="mb-1 font-normal text-muted normal-case">{t("team.risk.busfactor")}</div>
                      <ul className="space-y-0.5">
                        {risks.busFactorProjects.map((r) => (
                          <li key={r.projectId}>
                            Project #{r.projectId} · {r.primaryMemberKey} ({(r.ratio * 100).toFixed(0)}%)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            )}
          </aside>
        </main>
      </div>
      )}
    </div>
  );
}
