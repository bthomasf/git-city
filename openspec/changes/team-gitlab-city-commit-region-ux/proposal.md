# 团队 GitLab 城市：Commit 展示、区域可见性与楼栋点击体验优化

## Why

当前团队 GitLab 城市在「谁在哪些业务线有贡献、commit 归属哪个项目、地图上区域与小区边界、以及点击楼栋后如何查看 commit」等体验上不够清晰：commit 列表用项目 ID 难以识别、区域/小区在地图上不突出、楼栋点击依赖侧边面板导致面板收起时无法查看详情。本次变更旨在提升团队页与地图的可读性与可用性，使成员贡献与 commit 信息一目了然，且点击楼栋即可在任意面板状态下查看详情。

## What Changes

- **Commit 展示使用项目名称**：团队页与楼栋点击后的 commit 列表中，用项目名称（或 path_with_namespace）替代项目 ID 显示，便于快速识别所属项目。
- **地图上突出区域与小区**：通过区域标签、小区边界或名称标注等方式，使地图上一目了然看到「有哪些区域、每个区域下有哪些小区」，提升空间认知。
- **楼栋点击详情不依赖侧边面板**：点击某栋楼时，该楼对应的 commit 等详情通过弹窗、浮动卡片或固定位置浮层等方式展示，不依赖侧边面板是否展开；面板收起时仍可查看并关闭。
- 无破坏性变更。

## Capabilities

### New Capabilities

- `commit-display-project-name`：在团队页与楼栋点击后的 commit 展示中，使用项目名称（或 path_with_namespace）替代项目 ID，便于识别所属项目。
- `region-neighborhood-map-visibility`：在地图上突出区域与小区的视觉层次（区域标签、小区边界/名称等），使用户一眼能分辨区域与小区范围。
- `building-click-commit-display`：点击楼栋时，在不依赖侧边面板的前提下展示该楼对应的 commit 等详情（如弹窗、浮动卡片），支持面板收起时仍可查看与关闭。

### Modified Capabilities

- （无：本次为新增能力与展示方式调整，不修改已有 spec 的需求定义。）

## Impact

- **前端**：团队页 commit 列表展示逻辑（项目名称来源与展示）、城市地图区域/小区样式与标签、楼栋点击后的详情展示组件与挂载位置（脱离侧栏依赖）。
- **API/数据**：commit 或城市接口若当前仅返回 projectId，需补充项目名称或 path_with_namespace 供前端展示；若无则需在现有 city/commits 或 project 接口中提供。
- **依赖**：无新增运行时依赖；若采用新 UI 组件（如 Modal/Popover），可能依赖现有 UI 库或新增轻量实现。
