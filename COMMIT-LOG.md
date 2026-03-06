# Commit Log

### feat(gitlab-city): add GitLab team city view base — fengbin04@corp.netease.com
**日期**: 2026-03-05

**改动摘要**: 基于 OpenSpec 引入团队 GitLab 城市视图的整体方案与任务拆分，实现 GitLab API 客户端、活动与度量计算核心库、团队页面与同步接口的基础版本。

**影响范围**:
- `.cursor/commands/*`: 新增一组 OpenSpec 相关命令说明，支持在项目中快速创建、应用与验证变更。
- `.cursor/skills/openspec-*`: 新增 OpenSpec 操作相关技能定义，用于规范化变更流程与自动化协作。
- `openspec/changes/team-gitlab-city/**`: 新增团队 GitLab 城市视图相关的设计、方案、任务及子特性交付规范。
- `openspec/config.yaml`: 新增 OpenSpec 配置，注册 team-gitlab-city 变更入口。
- `src/app/api/gitlab/sync/route.ts`: 新增 GitLab 项目同步 API 路由，作为服务器端同步入口。
- `src/app/layout.tsx`: 调整全局布局以适配团队视图与国际化等新内容。
- `src/app/team/page.tsx`: 新增团队 GitLab 城市视图页面的基础实现入口。
- `src/lib/gitlab.ts`: 新增 GitLab REST API 客户端封装，统一处理鉴权与请求。
- `src/lib/gitlab-activity.ts`: 新增 GitLab 活动事件聚合逻辑，为城市视图提供活动数据。
- `src/lib/gitlab-metrics.ts`: 新增用于计算贡献度、活跃度等指标的度量模型。
- `src/lib/gitlab-city.ts`: 新增将指标与活动映射为城市可视化数据结构的逻辑。
- `src/lib/i18n.ts`: 新增简易国际化工具，支持后续多语言扩展。

**行为变化**:
- 项目内新增 GitLab 团队城市视图相关的 OpenSpec 变更入口与规范文档，便于后续按规范迭代。
- 通过新的 GitLab API 封装、活动与指标库，为前端城市视图页面提供基础数据模型与同步能力。
- 新增团队页面路由，为后续接入真实 GitLab 项目数据与城市可视化组件打下基础。

### feat(team): region-neighborhood city, member list and commit links — fengbin04@corp.netease.com
**日期**: 2026-03-06

**改动摘要**: 实现区域-小区-楼栋城市结构：支持 GITLAB_REGIONS_CONFIG_JSON 与视觉规则配置，新增 city/commits API；团队页在区域模式下从 buildingRows 聚合展示成员列表，最近 commit 支持点击跳转 GitLab 对应 commit 页。

**影响范围**:
- `.env.example`: 精简为仅 GitLab City 相关配置，增加区域配置与视觉规则说明。
- `README.md`: 重写为以 GitLab City 为主，说明城市/区域/小区/楼栋及配置来源。
- `openspec/changes/team-gitlab-city-regions-neighborhoods/*`: 新增 proposal、design、specs、tasks 等 OpenSpec 变更产物。
- `package.json` / `package-lock.json`: 依赖调整。
- `src/app/api/gitlab/city/route.ts`: 新增城市 API，返回 regions、buildingRows、layout。
- `src/app/api/gitlab/commits/route.ts`: 新增 commit 列表 API，返回带 web_url 的 commit 供前端跳转。
- `src/app/team/page.tsx`: 区域模式写入 buildingRows、从 buildingRows 聚合 regionMembers 并展示成员表；commit 列表支持 web_url 外链。
- `src/lib/gitlab-activity.ts`: 活动聚合逻辑调整以配合区域/项目。
- `src/lib/gitlab-metrics.ts`: 度量计算扩展。
- `src/lib/gitlab-regions-city.ts`: 区域-小区楼栋数据与 buildingRows 构建。
- `src/lib/gitlab-regions-config.ts`: 区域配置解析。
- `src/lib/gitlab-regions-layout.ts`: 区域布局与 3D 建筑/装饰生成。
- `src/lib/gitlab-visual-rules.ts`: 视觉规则（高度、亮窗）解析与应用。
- `src/lib/gitlab.ts`: 新增 fetchProject、fetchProjectCommitsByAuthor 等。
- `src/lib/i18n.ts`: 新增 team.commits.openInGitlab 等文案。
- `src/middleware.ts`: 仅在配置 Supabase 且请求带 sb-* cookie 时刷新会话，避免未配置时报错。

**行为变化**:
- 支持按区域-小区配置生成多区域多小区多楼栋城市视图，建筑高度与亮窗可由 GITLAB_VISUAL_RULES_JSON/URL 配置。
- 团队页在区域模式下展示由楼栋数据聚合的成员列表，与扁平模式一致可点击查看贡献。
- 点击某楼「最近 Commit」中某条 commit 可在新标签页打开对应 GitLab commit 页面。

