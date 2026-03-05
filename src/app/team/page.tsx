"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { CityBuilding, CityPlaza, CityDecoration, CityRiver, CityBridge } from "@/lib/github";
import type { AggregatedMetrics, CollaborationEdge, RiskSummary, MemberAggregate } from "@/lib/gitlab-metrics";
import { buildGitlabCityLayoutFromMetrics } from "@/lib/gitlab-city";
import { t } from "@/lib/i18n";

const CityCanvas = dynamic(() => import("@/components/CityCanvas"), {
  ssr: false,
});

interface TeamCityState {
  metrics: AggregatedMetrics | null;
  buildings: CityBuilding[];
  plazas: CityPlaza[];
  decorations: CityDecoration[];
  river: CityRiver | null;
  bridges: CityBridge[];
}

export default function TeamGitlabCityPage() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<TeamCityState | null>(null);
  const [focusedLogin, setFocusedLogin] = useState<string | null>(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/gitlab/sync?days=${days}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as AggregatedMetrics;
        if (cancelled) return;
        const layout = buildGitlabCityLayoutFromMetrics(json);
        setState({
          metrics: json,
          buildings: layout.buildings,
          plazas: layout.plazas,
          decorations: layout.decorations,
          river: layout.river,
          bridges: layout.bridges,
        });
        setFocusedLogin(null);
      } catch (e) {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error("[team-gitlab-city] 加载失败", e);
        setError(t("team.error"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [days]);

  const members = useMemo<MemberAggregate[]>(() => state?.metrics?.members ?? [], [state]);
  const collaborations = useMemo<CollaborationEdge[]>(() => state?.metrics?.collaborations ?? [], [state]);
  const risks = useMemo<RiskSummary | null>(() => state?.metrics?.risks ?? null, [state]);

  const selectedMember = useMemo(
    () => members.find((m) => m.key === focusedLogin) ?? null,
    [members, focusedLogin],
  );

  const topCollaborations = useMemo(() => {
    if (!focusedLogin) return collaborations.slice(0, 10);
    return collaborations
      .filter((c) => c.from === focusedLogin || c.to === focusedLogin)
      .slice(0, 10);
  }, [collaborations, focusedLogin]);

  const handleMemberClick = (m: MemberAggregate) => {
    setFocusedLogin(m.key);
  };

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
            onBuildingClick={(b) => setFocusedLogin(b.login)}
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
        {panelCollapsed ? "展开面板" : "收起面板"}
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
            <input
              type="text"
              placeholder={t("team.search.placeholder")}
              className="w-full rounded-md border border-border bg-bg px-3 py-1.5 text-[11px] outline-none placeholder:text-muted sm:max-w-xs"
              onChange={(e) => setFocusedLogin(e.target.value.trim() || null)}
              value={focusedLogin ?? ""}
            />
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
              <table className="w-full border-collapse text-[11px]">
                <thead className="sticky top-0 bg-bg-raised">
                  <tr className="text-muted">
                    <th className="px-2 py-1 text-left font-normal">#</th>
                    <th className="px-2 py-1 text-left font-normal">User</th>
                    <th className="px-2 py-1 text-right font-normal">{t("team.members.score")}</th>
                    <th className="px-2 py-1 text-right font-normal">{t("team.members.commits")}</th>
                    <th className="px-2 py-1 text-right font-normal">{t("team.members.mr")}</th>
                    <th className="px-2 py-1 text-right font-normal">{t("team.members.issue")}</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m, idx) => (
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
            </div>
          </section>

          <aside className="pointer-events-auto flex w-[260px] flex-col gap-3">
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
          </aside>
        </main>
      </div>
      )}
    </div>
  );
}

