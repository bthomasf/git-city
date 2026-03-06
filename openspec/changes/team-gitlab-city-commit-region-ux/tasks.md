## 1. API：补充项目名称字段

- [x] 1.1 commits API 在响应中增加 project_name 或 path_with_namespace（已有 fetchProject 时复用），单次响应级别或每条 commit 附带均可，供前端展示项目名称
- [x] 1.2 city API 的 buildingRows 在构建时按 projectId 解析项目信息，每行增加 projectName 或 pathWithNamespace；解析失败时保留原字段，不阻断返回
- [x] 1.3 保持 commits、city 现有字段与契约兼容，前端可渐进使用新字段并回退为 projectId 展示

## 2. 前端：Commit 与项目列表展示项目名称

- [x] 2.1 团队页「最近 Commit」区块的标题/副标题改为优先展示项目名称（或 path_with_namespace），无名称时回退为「项目 #id」
- [x] 2.2 成员详情、协作关系等涉及项目列表的展示改为优先展示项目名称，无名称时回退为项目 ID
- [x] 2.3 所有使用 projectId 展示的地方统一读取 API 返回的 project_name/pathWithNamespace，并处理空值回退

## 3. 地图：区域与小区可见性

- [x] 3.1 在 3D 场景中为每个区域增加区域名称标签（2D 标签、Sprite 或 DOM overlay），展示配置中的区域 name，保证常见视角下可读
- [x] 3.2 为区域增加边界或色带等视觉区分，使各区域范围可辨
- [x] 3.3 在小区范围或入口处增加小区名称标注（或边界/底色），与区域层次可区分；可选 LOD：远看区域名、近看小区名
- [x] 3.4 确保区域/小区标签与现有建筑布局、实例化逻辑兼容，不破坏现有渲染

## 4. 楼栋点击：独立浮层展示 Commit

- [x] 4.1 新增独立展示层组件（Modal/浮动卡片/Popover），挂载到 body 或根布局，用于展示某楼的 commit 列表与项目名称
- [x] 4.2 点击地图某栋楼时打开该展示层，根据 projectId + developerKey 请求 commit 接口并展示最近 10 条 commit（含时间、标题、web_url 跳转）；展示层内标题/副标题使用项目名称
- [x] 4.3 展示层支持关闭（关闭按钮或遮罩点击），且不依赖侧边面板是否展开；侧栏收起时点击楼栋仍能打开并关闭展示层
- [x] 4.4 处理浮层与 3D 的 z-index/点击穿透：浮层打开时遮罩拦截点击，可选在打开期间忽略楼栋 raycast 避免误触
- [x] 4.5 与侧栏内「选中楼栋 + commit」区块统一或并存：确定是仅用浮层展示楼栋 commit，还是侧栏保留成员选中时的详情，并在实现中保持一致
