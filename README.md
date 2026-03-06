# GitLab City

将团队 GitLab 的代码活动映射为一座 3D 像素风城市：按业务线划分区域，区域内为小区（项目），小区内每栋楼代表一名在该项目有贡献的开发者。支持按用户筛选视图、点击楼栋查看最近 commit、以及可配置的建筑高度与亮窗规则。

---

## 功能概览

- **多区域多小区多楼** — 城市由多个区域（业务线）组成，每区域下多个小区（项目），每小区内多栋楼（每栋楼 = 一名开发者在该项目的贡献）
- **按用户筛选** — 搜索 GitLab 用户名后，仅展示该用户在各区域各小区内的楼，其他楼隐藏
- **点击楼栋看 Commit** — 点击某栋楼可查看该用户在该项目下的最近 10 条 commit
- **视觉规则可配置** — 建筑高度、窗户亮灯比例等由配置驱动（指标、区间、公式可调），无需改代码
- **中文界面** — 团队城市页面与交互为中文，适合内网办公场景

---

## 城市、区域、小区、楼栋与配置规则

### 层级关系

| 概念 | 含义 | 配置/数据来源 |
|------|------|----------------|
| **城市** | 整座 3D 城的统称，由多个区域在平面上排布而成 | 由「区域配置 + GitLab 活动数据」共同生成 |
| **区域** | 对应业务线（如后端、前端），是城市里的一块「地块」 | 来自 `GITLAB_REGIONS_CONFIG_JSON` 中的 `regions[].id` 与 `regions[].name` |
| **小区** | 对应一个或多个 GitLab 项目，挂在某区域下 | 来自 `regions[].neighborhoods[]`，每项含 `id`、`name`、`projectIds[]` |
| **楼栋** | 一栋楼 = 一个「(项目, 开发者)」：该开发者在该项目有 commit/MR/Issue 等贡献 | 由 GitLab 活动数据聚合得到：同一开发者在多个项目有贡献则会在多个小区各有一栋楼 |

### 楼栋具体参数的配置规则来源

每栋楼在 3D 中的表现（高度、窗户亮灯、宽深等）由以下规则决定：

| 参数 | 含义 | 配置规则来源 |
|------|------|----------------|
| **高度 (height)** | 楼栋的竖直高度（像素） | **视觉规则配置**：`GITLAB_VISUAL_RULES_JSON` 或 `GITLAB_VISUAL_RULES_URL` 中的 `height`。指定用哪项指标（`score` / `commits` / `mergeRequests` / `issues`）、`minHeight`、`maxHeight`、`maxIndicatorValue`。未配置则使用内置默认（按 score 线性映射到 35–600） |
| **亮窗比例 (litPercentage)** | 窗户亮灯比例，0–1 | **视觉规则配置**：同上中的 `litPercentage`，指定 `indicator`、`minLit`、`maxLit`、`maxIndicatorValue`。未配置则使用内置默认 |
| **贡献指标 (score / commits / mergeRequests / issues)** | 用于算高度和亮窗的原始数据 | **GitLab 活动数据**：通过 GitLab API 拉取各项目的 commit、Merge Request、Issue，按 `GITLAB_WEIGHT_COMMIT` / `GITLAB_WEIGHT_MR` / `GITLAB_WEIGHT_ISSUE` 及可选的 `GITLAB_PROJECT_WEIGHTS` 加权聚合为每个 (项目, 开发者) 的 score 与各项计数 |
| **宽度、深度 (width, depth)** | 楼栋底面宽深 | 当前由**内置算法**根据开发者标识做确定性随机生成；视觉规则中未暴露为可配置项 |
| **楼层数 (floors)** | 由高度与固定层高推导 | **内置公式**：`height / 6` 向下取整，最小 3 层 |

总结：**楼栋高度与亮窗**由「视觉规则配置」+「GitLab 聚合指标」共同决定；**楼栋归属（属于哪一区域、哪一小区）**由「区域-小区配置」决定；**谁在哪一小区有一栋楼**由「该开发者在对应项目是否有活动」决定。

---

## 区域-小区配置说明

使用**区域-小区模式**时，必须配置 `GITLAB_REGIONS_CONFIG_JSON`（JSON 字符串，可压缩为一行）。结构如下：

- **regions**：数组，至少一项。每项表示一个区域（业务线）。
  - **id**：区域唯一标识（字符串）
  - **name**：区域显示名（如「后端业务线」）
  - **neighborhoods**：该区域下的小区数组，至少一项
- **neighborhoods[]**：每个小区对应一组 GitLab 项目。
  - **id**：小区唯一标识
  - **name**：小区显示名（如「API 服务」）
  - **projectIds**：数字数组，至少一个 GitLab 项目 ID

示例见 [docs/GITLAB-REGIONS-MIGRATION.md](docs/GITLAB-REGIONS-MIGRATION.md) 与 [docs/TEAM-GITLAB-CITY-DEPLOY.md](docs/TEAM-GITLAB-CITY-DEPLOY.md)。

未配置 `GITLAB_REGIONS_CONFIG_JSON` 时，将使用兜底模式：仅配置 `GITLAB_GROUP_IDS` / `GITLAB_PROJECT_IDS`，城市为「单小区、每用户一栋楼」。

---

## 视觉规则配置说明（可选）

通过 `GITLAB_VISUAL_RULES_JSON` 或 `GITLAB_VISUAL_RULES_URL` 可自定义建筑高度与亮窗，不配置则使用内置默认。

- **height**：`indicator`（`score` | `commits` | `mergeRequests` | `issues`）、`minHeight`、`maxHeight`、`maxIndicatorValue`
- **litPercentage**：同上结构，`minLit`、`maxLit` 为 0–1

详见 [docs/TEAM-GITLAB-CITY-DEPLOY.md](docs/TEAM-GITLAB-CITY-DEPLOY.md)。

---

## 快速开始

```bash
# 克隆仓库
git clone <your-repo-url>
cd git-city

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 至少填写：GITLAB_BASE_URL、GITLAB_TOKEN
# 区域模式还需填写 GITLAB_REGIONS_CONFIG_JSON（见上方说明与 docs）

# 启动开发服务
npm run dev
```

在浏览器打开 [http://localhost:3001/team](http://localhost:3001/team) 查看团队 GitLab 城市。配置了区域-小区后，可尝试搜索用户名筛选、点击楼栋查看 commit。

更多部署与回滚说明见 [docs/TEAM-GITLAB-CITY-DEPLOY.md](docs/TEAM-GITLAB-CITY-DEPLOY.md)。

---

## 技术栈

- **框架**：Next.js（App Router）
- **3D**：Three.js、@react-three/fiber、@react-three/drei
- **样式**：Tailwind CSS
- **数据**：GitLab REST API（内网实例），按需配置 Supabase 等

---

## 许可证

[AGPL-3.0](LICENSE)。使用与修改需遵守协议，公网部署需开放源代码。
