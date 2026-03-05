## ADDED Requirements

### Requirement: 成员协作关系可视化
系统 MUST 基于 Merge Request 与 Review 行为构建成员之间的协作关系图，并在团队城市视图中以连线、道路或光束等形式进行可视化展示。

#### Scenario: 绘制 Review 协作连线
- **WHEN** 某成员对另一成员创建的 Merge Request 进行 Review 或审批
- **THEN** 系统 SHALL 在协作图中为这两位成员之间增加或增强一条连接边
- **THEN** 城市视图 SHALL 使用线条或光束将两位成员楼宇连接起来
- **THEN** 当两位成员之间在指定时间范围内没有任何协作行为时，城市视图 SHALL 不再渲染对应连接

### Requirement: 控制协作连线密度
系统 MUST 提供控制协作连线显示密度的能力，以避免在成员和项目较多时出现严重的视图拥挤和性能问题。

#### Scenario: 用户关闭协作连线图层
- **WHEN** 用户在界面中关闭「显示协作关系」或将协作密度滑块调至最低
- **THEN** 城市视图 SHALL 隐藏所有成员之间的连线元素
- **THEN** 系统 SHALL 仅保留成员楼宇与项目街区的可视化
- **THEN** 当用户重新开启协作显示时，系统 SHALL 基于当前时间范围与过滤条件重新渲染协作连线

