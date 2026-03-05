## ADDED Requirements

### Requirement: 保持现有 GitHub 城市视图可用
系统 MUST 在引入团队 GitLab 城市的同时，保持现有 GitHub 城市视图能力可用，不影响当前依赖 GitHub 数据的城市展示与交互。

#### Scenario: 访问原有 GitHub 城市入口
- **WHEN** 用户通过原有入口访问基于 GitHub 的城市视图
- **THEN** 系统 SHALL 按照现有逻辑加载本地 Git 或 GitHub 数据并渲染城市
- **THEN** 新增的 GitLab 城市能力 SHALL 不修改原有 GitHub 城市的默认行为

### Requirement: 为后续扩展预留统一可视化映射
系统 MUST 在城市渲染层预留统一的可视化映射机制，使未来 GitHub 与 GitLab 数据可以共用同一套楼宇高度、颜色与布局映射规则，便于跨平台对齐体验。

#### Scenario: 使用统一映射规则渲染 GitHub 与 GitLab 城市
- **WHEN** 渲染基于 GitHub 的城市视图或基于 GitLab 的团队城市视图
- **THEN** 城市渲染引擎 SHALL 通过统一的配置或接口获取贡献度与活跃度到可视化属性的映射规则
- **THEN** 同样数值区间的贡献度在 GitHub 城市和 GitLab 城市中 SHALL 显示为相近的楼宇高度与亮度

