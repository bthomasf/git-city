import { NextResponse } from "next/server";
import { runGitlabSyncJob } from "@/lib/gitlab-activity";
import { aggregateGitlabActivities } from "@/lib/gitlab-metrics";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get("days");
    const untilParam = searchParams.get("until");

    const days = daysParam ? Number(daysParam) : 30;
    const now = untilParam ? new Date(untilParam) : new Date();
    const since = new Date(now.getTime() - Math.max(1, days) * 24 * 60 * 60 * 1000);

    const { window, events, projectIds } = await runGitlabSyncJob({
      since: since.toISOString(),
      until: now.toISOString(),
    });
    const metrics = aggregateGitlabActivities(window, events, projectIds);
    return NextResponse.json(metrics);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[gitlab-sync] 同步任务失败", error);
    return NextResponse.json(
      { error: "GitLab 同步失败，请检查服务器日志与配置。" },
      { status: 500 },
    );
  }
}

