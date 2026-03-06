import { NextResponse } from "next/server";
import { fetchProject, fetchProjectCommitsByAuthor } from "@/lib/gitlab";

/**
 * GET /api/gitlab/commits?projectId=123&username=xxx&limit=10
 * 返回该用户在该项目下的最新 commit 列表，每条带 webUrl 用于跳转 GitLab。
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectIdParam = searchParams.get("projectId");
    const username = searchParams.get("username")?.trim();
    const limitParam = searchParams.get("limit");

    const projectId = projectIdParam ? Number(projectIdParam) : NaN;
    if (!Number.isFinite(projectId) || projectId <= 0) {
      return NextResponse.json(
        { error: "缺少或无效的 projectId。" },
        { status: 400 },
      );
    }
    if (!username) {
      return NextResponse.json(
        { error: "缺少 username 参数。" },
        { status: 400 },
      );
    }
    const limit = limitParam ? Math.min(100, Math.max(1, Number(limitParam))) : 10;

    const commits = await fetchProjectCommitsByAuthor(projectId, username, limit);
    let pathWithNamespace: string | null = null;
    let projectName: string | null = null;
    try {
      const project = await fetchProject(projectId);
      pathWithNamespace = project.path_with_namespace;
      projectName = project.name ?? null;
    } catch {
      // 项目信息拉取失败时仍返回 commit 列表，仅无跳转链接与项目名称
    }
    const baseUrl = (process.env.GITLAB_BASE_URL ?? "").replace(/\/+$/, "");
    const commitsWithUrl = commits.map((c) => ({
      ...c,
      web_url: baseUrl && pathWithNamespace
        ? `${baseUrl}/${pathWithNamespace}/-/commit/${c.short_id}`
        : null,
    }));
    return NextResponse.json({
      commits: commitsWithUrl,
      project_name: projectName,
      path_with_namespace: pathWithNamespace,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[gitlab-commits] 拉取 commit 失败", error);
    return NextResponse.json(
      { error: "获取 commit 列表失败，请检查项目 ID 与用户名或稍后重试。" },
      { status: 500 },
    );
  }
}
