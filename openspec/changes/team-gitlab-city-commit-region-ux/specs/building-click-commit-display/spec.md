# 点击楼栋展示 Commit 详情（不依赖侧边面板）（building-click-commit-display）

## ADDED Requirements

### Requirement: 点击楼栋后在不依赖侧边面板的展示层中显示 commit 等详情
系统 SHALL 在用户点击某栋楼时，通过独立于侧边面板的展示层（如弹窗、浮动卡片或固定位置浮层）展示该楼对应的「(项目, 开发者)」的最近 commit 等详情；该展示层 SHALL 不依赖侧边面板是否展开，面板收起时用户仍可查看并关闭。

#### Scenario: 点击楼栋打开独立展示层
- **WHEN** 用户点击团队城市地图中某栋楼（或该楼的某一层）
- **THEN** 系统 SHALL 打开独立于侧边面板的展示层（Modal、Popover 或浮动卡片）
- **THEN** 该展示层 SHALL 展示该楼对应的 (projectId, developerKey) 在该项目下的最近 10 条 commit（含时间、标题、可选的跳转链接等）
- **THEN** 展示层 SHALL 可被用户主动关闭（如关闭按钮或点击遮罩）

#### Scenario: 侧边面板收起时仍可查看楼栋 commit
- **WHEN** 侧边面板处于收起或隐藏状态，用户点击某栋楼
- **THEN** 系统 SHALL 仍打开上述独立展示层并展示该楼的 commit 列表
- **THEN** 系统 SHALL 不强制展开或依赖侧边面板以显示 commit 内容
- **THEN** 用户 SHALL 可在不展开侧边面板的情况下完成「点击楼栋 → 查看 commit → 关闭」的完整流程

### Requirement: 楼栋 commit 数据按需请求并展示项目名称
系统 SHALL 在用户点击楼栋时按需请求该楼对应的 commit 数据（如 GET /api/gitlab/commits）；展示层中 SHALL 使用项目名称（或 path_with_namespace）标识所属项目，与 commit-display-project-name 能力一致。

#### Scenario: 展示层内 commit 列表与项目标识
- **WHEN** 独立展示层已打开并展示某楼的 commit 列表
- **THEN** 列表 SHALL 包含每条 commit 的可读信息（如标题、时间、作者）
- **THEN** 展示层 SHALL 在标题或副标题处展示项目名称（或 path_with_namespace），而非仅项目 ID
- **THEN** 若接口提供 commit 的 web_url，SHALL 支持用户点击跳转至 GitLab 对应 commit 页面
