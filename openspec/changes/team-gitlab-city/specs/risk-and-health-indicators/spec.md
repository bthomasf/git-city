## ADDED Requirements

### Requirement: 识别不活跃项目与成员
系统 MUST 能够基于配置的时间阈值识别长期无提交或无 MR 活动的项目与成员，并在城市视图中以明显但不过度打扰的方式进行标注。

#### Scenario: 标记长时间无更新的项目街区
- **WHEN** 某项目在配置的时间阈值内（例如 30 天）没有任何 commit 或 Merge Request 被合并
- **THEN** 系统 SHALL 将该项目标记为「不活跃」状态
- **THEN** 城市视图 SHALL 以较暗的颜色或特殊纹理渲染该项目街区
- **THEN** 当用户悬停在该街区时，系统 SHALL 以中文 tooltip 显示「近期无更新」等说明信息

### Requirement: Bus Factor 风险提示
系统 MUST 能够识别由极少数成员主导的大项目或关键项目，并在城市视图中标记潜在的 Bus Factor 风险。

#### Scenario: 提示单人主导项目风险
- **WHEN** 某个项目在指定时间范围内绝大多数提交与 MR 来自同一名成员
- **THEN** 系统 SHALL 将该项目判定为存在 Bus Factor 风险
- **THEN** 城市视图 SHALL 在该项目对应的城市区域或该成员楼宇附近展示风险标识图标
- **THEN** 当用户点击风险标识时，系统 SHALL 以中文说明该风险的判定依据（如「最近 90 天 90% 以上提交来自同一人」）

