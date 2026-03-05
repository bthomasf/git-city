## ADDED Requirements

### Requirement: 团队分组筛选能力
系统 MUST 支持基于 GitLab Group、项目、技术栈标签或自定义分组，对团队成员和项目进行切片，并在城市视图中只展示被筛选范围内的楼宇与街区。

#### Scenario: 按 Group 筛选团队城市
- **WHEN** 用户在过滤面板中选择一个或多个 GitLab Group
- **THEN** 系统 SHALL 只加载这些 Group 下被配置为纳入统计范围的项目数据
- **THEN** 城市视图 SHALL 只渲染属于这些 Group 的项目街区与相关成员楼宇
- **THEN** 过滤条件 SHALL 以中文标签形式清晰展示在界面上

### Requirement: 组合过滤与重置
系统 MUST 支持组合使用多个过滤条件（如 Group + 项目 + 标签），并提供一键重置过滤的能力，方便用户在不同视角之间快速切换。

#### Scenario: 组合过滤与清空过滤
- **WHEN** 用户同时选择某个 Group 与该 Group 下的部分项目
- **THEN** 系统 SHALL 仅展示满足所有已选条件的成员和项目的城市元素
- **THEN** 界面 SHALL 提供明显的「清空筛选」中文按钮
- **THEN** 当用户点击「清空筛选」时，系统 SHALL 恢复到未过滤的团队总览城市视图

