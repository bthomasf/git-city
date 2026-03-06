# 点击楼层展示 Commit 详情（floor-commit-detail）

## ADDED Requirements

### Requirement: 点击楼层展示该用户在该项目下最新 10 条 commit
系统 SHALL 在用户点击某栋楼（或某层）时，展示该楼对应的「(项目, 开发者)」在该项目下的最新 10 条 commit 记录；数据 MUST 来自 GitLab 或经后端封装的 commit 接口，按项目与作者过滤。

#### Scenario: 点击楼后请求并展示 commit 列表
- **WHEN** 用户点击团队城市中某栋楼（或该楼的某一层）
- **THEN** 系统 SHALL 根据该建筑的 `projectId` 与 `developerKey`（如 username）请求该用户在该项目下的 commit 列表
- **THEN** 系统 SHALL 展示该用户在该项目下的最新 10 条 commit（至少包含时间、提交信息等可读字段）

#### Scenario: commit 列表展示形式
- **WHEN** 用户触发楼层/楼的点击
- **THEN** 系统 SHALL 以弹窗或侧栏等可见形式展示上述 commit 列表
- **THEN** 列表 SHALL 便于关闭或收起，且不阻塞用户继续浏览城市

### Requirement: commit 数据按需获取
系统 SHALL 在用户点击时按需请求 commit 数据（如 `GET /api/gitlab/commits?projectId=&username=&limit=10`），而非依赖预加载全部 commit；接口 MUST 支持按 `projectId`、用户标识与条数限制返回结果。

#### Scenario: 按需请求 commit 接口
- **WHEN** 用户首次点击某栋楼请求 commit 列表
- **THEN** 系统 SHALL 向后端或 GitLab 发起带 projectId、username、limit=10 的请求
- **THEN** 系统 SHALL 将返回的 commit 列表展示给用户；若请求失败，SHALL 给出明确错误或空状态提示
