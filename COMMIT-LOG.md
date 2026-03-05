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

