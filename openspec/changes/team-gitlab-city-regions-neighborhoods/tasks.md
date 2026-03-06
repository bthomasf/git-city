## 1. 区域-小区配置与数据聚合

- [x] 1.1 定义区域-小区配置 schema（YAML/JSON）：regions[]、每区域 id/name + neighborhoods[]、每小区 id/name + projectIds[]，并实现解析与类型定义
- [x] 1.2 实现配置校验逻辑：非空区域与小区、至少一个 projectId、可选与 GitLab 校验 project 可访问性，失败时返回明确错误
- [x] 1.3 基于区域-小区配置与现有 gitlab-activity/gitlab-metrics 聚合出 (projectId, developerKey) 维度的贡献数据，每二元组对应一栋楼
- [x] 1.4 在未配置区域时保留对现有 GITLAB_PROJECT_IDS/GITLAB_GROUP_IDS 的兜底解析，并输出从扁平列表迁移到区域-小区配置的说明

## 2. 视觉规则配置

- [x] 2.1 定义视觉规则配置 schema（JSON）：建筑高度与指标/公式/区间映射、窗户亮灯与指标/阈值映射
- [x] 2.2 实现视觉规则加载（环境变量 URL、部署目录静态文件或内置默认），配置缺失或无效时使用内置默认规则
- [x] 2.3 在生成单栋建筑的 height、litPercentage 等属性时改为读取并应用当前视觉规则配置，替代写死的 calcHeight/亮窗逻辑

## 3. API：城市数据与 Commit 列表

- [x] 3.1 扩展或新增团队城市数据接口，返回「区域→小区→建筑」结构，每建筑含 regionId、neighborhoodId、projectId、developerKey 及贡献指标
- [x] 3.2 城市数据接口支持查询参数 filterUser=username，服务端仅返回该用户在各区域各小区的楼
- [x] 3.3 新增 GET /api/gitlab/commits，支持 projectId、username、limit=10，从 GitLab 按需拉取该用户在该项目下最新 commit 并返回
- [x] 3.4 为 commit 接口与城市数据接口增加限流与错误处理，请求失败时返回明确提示

## 4. 布局与 3D 渲染

- [x] 4.1 实现「区域-小区-楼」2D 平面布局算法：按区域分块、每区域内小区块、每小区内多栋楼网格/格点排列，输出与现有 buildings 兼容的结构并附带 regionId/neighborhoodId 等元数据
- [x] 4.2 团队城市页使用新布局数据驱动 CityCanvas/CityScene，渲染多区域、多小区、每小区多栋楼的 3D 场景
- [x] 4.3 实现按用户筛选：搜索框输入用户名后写入「当前筛选用户」状态，请求城市数据带 filterUser 或前端过滤，场景中只渲染该用户的楼；提供「清除筛选」恢复全量视图
- [x] 4.4 实现点击楼/层交互：根据建筑 projectId 与 developerKey 请求 commit 列表，在弹窗或侧栏展示该用户在该项目下最新 10 条 commit（时间、提交信息等）

## 5. 中文与文档

- [x] 5.1 将团队城市相关路由与组件的文案改为中文（i18n 或常量），确保搜索、筛选、commit 列表、按钮等为中文显示
- [x] 5.2 在 docs 或 README 中补充区域-小区配置示例、视觉规则配置说明及内网部署步骤（含环境变量与可选回滚方式）
