## ADDED Requirements

### Requirement: GitLab 接入配置管理
系统 MUST 提供通过配置文件或环境变量管理 GitLab 接入参数的能力，包括 GitLab 基础地址、访问 Token 以及需要纳入统计的 Group 与项目列表。

#### Scenario: 通过配置限制统计范围
- **WHEN** 管理者在配置中仅列出部分 Group 与项目作为纳入统计的目标
- **THEN** 系统 SHALL 只对这些配置的 Group 与项目进行数据同步与指标计算
- **THEN** 城市视图 SHALL 不展示未被配置的 Group 与项目相关的任何楼宇或街区

### Requirement: 权限与隐私控制
系统 MUST 遵守 GitLab 权限体系，不向无权限用户展示其无权访问的项目或成员活动数据，并在 UI 中避免泄露敏感信息。

#### Scenario: 普通成员访问团队城市
- **WHEN** 某普通成员登录系统并访问团队城市页面
- **THEN** 系统 SHALL 只展示其在 GitLab 中具有至少读取权限的项目与相关成员活动
- **THEN** 对于该成员在 GitLab 无访问权限的项目，系统 SHALL 不在城市中暴露项目名称或成员具体操作明细
- **THEN** 如因权限限制导致某些城市区域被隐藏，系统 SHOULD 在 UI 中以中文提示数据可能因权限限制而不完整

