# 区域-小区-楼配置（region-neighborhood-building-config）

## ADDED Requirements

### Requirement: 区域-小区-楼层级配置
系统 SHALL 支持「区域（业务线）→ 小区（项目）→ 楼（开发者）」的可配置层级结构；配置 MUST 支持多个区域、每区域下多个小区、每小区对应一个或多个 GitLab 项目 ID；每栋楼 MUST 对应一个在该项目有贡献的开发者。

#### Scenario: 加载有效层级配置
- **WHEN** 系统启动或刷新团队城市数据时读取区域-小区配置
- **THEN** 系统 SHALL 解析配置中的区域列表、每区域下的小区列表、以及每小区关联的项目 ID 列表
- **THEN** 系统 SHALL 根据项目 ID 与活动数据聚合出「(项目, 开发者)」二元组，每个二元组对应一栋楼

#### Scenario: 配置格式与校验
- **WHEN** 配置被加载或热更新
- **THEN** 系统 SHALL 支持至少一种结构化格式（如 YAML 或 JSON），包含 `regions[]`、每区域含 `id`/`name` 与 `neighborhoods[]`、每小区含 `id`/`name` 与 `projectIds[]`
- **THEN** 系统 SHALL 在应用配置前执行校验（如非空区域、小区至少含一个项目 ID）；校验失败时 SHALL 拒绝应用并给出明确错误信息

### Requirement: 建筑与项目-开发者一一对应
系统 MUST 将每栋楼唯一对应一个「(项目, 开发者)」二元组；同一开发者在多个项目有贡献时，MUST 在对应多个小区各有一栋楼；单栋楼的楼层与外观指标 SHALL 仅反映该开发者在该项目上的贡献数据。

#### Scenario: 多项目开发者多栋楼
- **WHEN** 开发者 A 在项目 P1、P2 均有提交记录
- **THEN** 系统 SHALL 在 P1 所在小区为 A 生成一栋楼、在 P2 所在小区为 A 生成另一栋楼
- **THEN** 每栋楼的高度与亮窗等 SHALL 仅基于该楼对应的 (P1,A) 或 (P2,A) 的贡献指标计算
