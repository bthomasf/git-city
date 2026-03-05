## ADDED Requirements

### Requirement: 成员个人 GitLab 城市总览
系统 MUST 在输入有效的 GitLab 用户名后，为该成员生成个人 GitLab 城市视图，聚合团队内所有纳入统计项目中的该成员活动数据。

#### Scenario: 查看个人 GitLab 城市
- **WHEN** 用户在搜索框中输入某个成员的 GitLab 用户名并确认
- **THEN** 系统 SHALL 校验该用户名是否存在于已同步数据中
- **THEN** 如果存在，系统 SHALL 加载该成员在所有相关项目中的活动数据并渲染个人城市视图
- **THEN** 个人城市视图 SHALL 显示该成员的主参与项目、近期活跃度和楼宇分布

### Requirement: 成员画像与趋势信息展示
系统 MUST 在个人城市视图旁展示成员画像信息，包括核心参与项目列表、常见协作伙伴以及近期活跃度趋势曲线。

#### Scenario: 展示成员画像面板
- **WHEN** 个人 GitLab 城市视图成功渲染
- **THEN** 系统 SHALL 在同一页面上展示一个成员画像侧边栏或信息面板
- **THEN** 该面板 SHALL 至少包含该成员近一段时间的活跃度趋势、参与项目 Top N 列表以及协作伙伴 Top N 列表
- **THEN** 所有字段说明与标题 SHALL 使用中文文案展示

