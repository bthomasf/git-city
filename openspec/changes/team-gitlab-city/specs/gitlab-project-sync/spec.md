## ADDED Requirements

### Requirement: GitLab 多 Group 多项目数据同步
系统 MUST 能够从配置指定的多个 GitLab Group 与项目中，增量同步用于构建城市视图所需的核心数据，包括 commit、Merge Request、Review 以及 Issue 相关事件。

#### Scenario: 定时同步 GitLab 活动数据
- **WHEN** 到达配置的同步时间点（例如每 5 分钟或每 15 分钟）
- **THEN** 系统 SHALL 依次遍历配置中的 Group 与项目列表
- **THEN** 系统 SHALL 调用 GitLab API 拉取上次成功同步时间点之后的新活动数据
- **THEN** 系统 SHALL 记录本次同步的时间边界，用于下次增量同步

### Requirement: 同步失败重试与告警
系统 MUST 在 GitLab API 调用失败或部分项目同步失败时提供重试机制，并在连续多次失败时产生可观测的告警信号。

#### Scenario: GitLab API 调用失败时的处理
- **WHEN** 系统在同步某个项目数据时收到 GitLab API 错误响应（如 5xx 或超时）
- **THEN** 系统 SHALL 在合理的重试间隔内对该项目进行有限次数的重试
- **THEN** 如果重试仍然失败，系统 SHALL 标记该项目为「同步异常」并记录详细错误信息
- **THEN** 系统 SHALL 将异常信息暴露给监控/日志系统，便于运维排查

