# Commit 展示使用项目名称（commit-display-project-name）

## ADDED Requirements

### Requirement: commit 相关展示使用项目名称而非仅项目 ID
系统 SHALL 在团队页与楼栋点击后的 commit 展示中，使用项目名称（或 path_with_namespace）作为主要或辅助展示，以便用户快速识别 commit 所属项目；当无法获取项目名称时，SHALL 回退为展示项目 ID。

#### Scenario: 团队页或楼栋 commit 列表标题/副标题展示项目名称
- **WHEN** 用户查看团队页中某楼栋的「最近 Commit」列表或与 commit 相关的区块
- **THEN** 系统 SHALL 在该区块的标题或副标题处展示项目名称（或 path_with_namespace），而非仅展示「项目 #id」
- **THEN** 若接口未返回项目名称，系统 SHALL 回退展示「项目 #projectId」或等效标识

#### Scenario: commit 接口或城市数据提供项目名称
- **WHEN** 前端请求 commit 列表（如 GET /api/gitlab/commits）或城市数据（含 buildingRows）
- **THEN** 服务端 SHALL 在响应中提供可用于展示的项目名称或 path_with_namespace 字段（如 project_name、path_with_namespace）
- **THEN** 前端 SHALL 优先使用该字段进行展示，仅在字段缺失时使用 projectId

### Requirement: 成员详情等处的项目列表使用项目名称
系统 SHALL 在团队页成员详情、协作关系等涉及「项目」列表的展示中，优先展示项目名称（或 path_with_namespace）；无名称时 SHALL 回退为项目 ID 或「#id」形式。

#### Scenario: 成员详情中项目列表展示名称
- **WHEN** 用户选中某成员并查看其贡献的项目列表
- **THEN** 系统 SHALL 在项目列表中展示项目名称（或 path_with_namespace），而非仅「Project #id」
- **THEN** 若某项目无名称数据，SHALL 展示项目 ID 作为回退
