# LabFlow 迭代记录（中文版）

本文件记录 LabFlow 每一轮迭代的真实目标、改动、测试、Git 分支、commit SHA、GitHub 链接、已知问题和下一轮计划。

> 说明：Git 原始 commit message 属于历史对象，直接修改旧 message 必须重写历史并 force push，会改变所有 SHA 和链接。为避免破坏历史，本文件对全部迭代记录做中文整理，并附中文提交索引；旧 commit message 保留英文。从迭代 #8 起，新提交已使用中文。

## 如何查看 Git 版本记录

```sh
# 简洁历史（推荐）
git log --oneline --graph --decorate

# 带文件统计
git log --stat

# 查看某次提交
git show <SHA>

# 只看 dev 分支
git log --oneline --decorate dev
```

也可以在 GitHub 仓库的 Commits 页面查看：<https://github.com/CubicZnS/labflow/commits/dev>。

## 中文提交索引

| SHA | 日期 | 中文说明 |
|---|---|---|
| `2862994` | 2026-10-22 | 迭代 #9：合并 Phase 3.1 SVG 散点图到 dev |
| `0a8b1c5` | 2026-10-22 | 迭代 #9：补入刻度与极值修复提交 SHA |
| `9832aa8` | 2026-10-22 | 迭代 #9：修复单点/全同值刻度与极端值域 |
| `be87ab0` | 2026-10-22 | 迭代 #9：补入 SVG 散点图功能提交 SHA |
| `94e8067` | 2026-10-22 | 迭代 #9：Phase 3.1 SVG 散点图与自动坐标范围 |
| `00bc47b` | 2026-10-21 | 迭代 #8：记录 Phase 2.3a 中文迭代日志并更新路线图 |
| `7b2fbcb` | 2026-10-21 | 迭代 #8：Phase 2.3a Y 误差列与加权最小二乘拟合 |
| `93a1013` | 2026-10-21 | 修复：#8 `y_error_column` 空串返回 422 |
| `7c47690` | 2026-10-21 | 功能：为拟合加入 Y 误差列与加权最小二乘 |
| `4168609` | 2026-10-21 | 文档：记录 Phase 2.2 迭代 |
| `2475463` | 2026-10-21 | 合并：迭代 7 — 拟合系数不确定度与条件诊断 |
| `291864d` | 2026-10-21 | 功能：加入系数不确定度与条件诊断 |
| `201d244` | 2026-10-21 | 文档：记录 Phase 2.1 迭代 |
| `48a3440` | 2026-10-21 | 合并：迭代 6 — Phase 2.1 数据集拟合接口与拟合面板 |
| `a461da1` | 2026-10-21 | 功能：加入数据集多项式拟合接口与拟合面板 |
| `7060ed0` | 2026-10-21 | 文档：记录 Phase 1.5 迭代 |
| `760a30a` | 2026-10-21 | 合并：迭代 5 — X/Y 配对、单位与配对序列提取 |
| `ae91783` | 2026-10-21 | 修复：拒绝 datetime/timedelta 列作为数值列 |
| `1c9541d` | 2026-10-21 | 功能：加入 X/Y 配对、单位标签与配对序列提取 |
| `8c5aeb9` | 2026-10-21 | 文档：记录 Phase 1.4 迭代 |
| `746d502` | 2026-10-21 | 合并：迭代 4 — XLSX 导入与 CSV 校验契约 |
| `fcf7139` | 2026-10-21 | 修复：保留有数据支撑的空表头列 |
| `7446abb` | 2026-10-21 | 修复：重复表头标签冲突安全 |
| `f2e94cb` | 2026-10-21 | 功能：按 CSV 校验契约导入首个工作表 |
| `bf17768` | 2026-10-21 | 文档：记录 Phase 1.3 迭代 |
| `4868c1e` | 2026-10-21 | 合并：迭代 3 — 导入数值列的汇总统计 |
| `39baa39` | 2026-10-21 | 功能：加入确定性的列汇总统计 |
| `ca0c4e3` | 2026-10-21 | 文档：记录 Phase 1.2 迭代 |
| `6ed7e07` | 2026-10-21 | 合并：迭代 2 — CSV 上传与预览 UI |
| `80895d1` | 2026-10-21 | 功能：加入 CSV 上传与预览 UI |
| `f989508` | 2026-10-21 | 文档：记录 Phase 1.1 迭代 |
| `0c9f895` | 2026-10-21 | 合并：迭代 1 — CSV 导入与校验 API |
| `fba7414` | 2026-10-21 | 修复：拒绝不规则 CSV 行，避免字段错位 |
| `e2012ad` | 2026-10-21 | 功能：加入 CSV 导入接口、校验与警告 |
| `7b3c2f1` | 2026-10-21 | 文档：记录 Phase 0 迭代 |
| `471d103` | 2026-10-21 | 工程：LabFlow Phase 0 初始化 |

## 迭代 #0 — Phase 0 项目初始化

- 日期：2026-10-21
- 目标：初始化 LabFlow 仓库、可运行的前后端骨架、确定性分析测试、CI 和产品文档。
- 已完成：
  - 私有 GitHub 仓库 `CubicZnS/labflow`。
  - FastAPI 骨架，包含健康检查、统计和拟合接口。
  - 确定性分析模块和已知数值测试。
  - React/Vite/Tailwind 应用骨架和 Vitest 冒烟测试。
  - GitHub Actions 前后端 CI。
  - 产品路线图、架构、测试、商业模型、决策和 Agent 运行文档。
- 测试：
  - 后端：`ruff check app tests` 通过；`pytest -q` 通过（16 个测试）。
  - 前端：`pnpm typecheck` 通过；`pnpm test:run` 通过（2 个测试）；`pnpm build` 成功。
  - 运行时冒烟：`/api/health`、`/api/analysis/stats`、`/api/analysis/fit` 返回预期 JSON；`vite preview` 返回 HTTP 200。
  - CI：GitHub Actions 已配置后端 lint/test 与前端 typecheck/test/build。
- Git 分支：`main`（bootstrap commit）。
- Commit SHA：`471d10335c138d428b1039b7e53f24eaa063d33a`
- GitHub：https://github.com/CubicZnS/labflow/commit/471d10335c138d428b1039b7e53f24eaa063d33a
- 已知问题：
  - MVP UI 仍是骨架；CSV/XLSX 导入和绘图属于 Phase 1–3。
  - 尚无持久化、认证、计费或部署。
  - 已包含 Docker 文件，但开发用 Mac mini 未安装 Docker，未做容器冒烟。
  - FastAPI TestClient 有 Starlette/httpx 弃用警告；测试通过。
- 下一轮：Phase 1 — CSV 导入、校验和基础统计纵向切片。

## 迭代 #1 — Phase 1.1 CSV 解析与校验 API

- 日期：2026-10-21
- 目标：完成 Phase 1 的首个后端增量——确定性 CSV 导入、校验、数据质量警告和预览返回。
- 任务：MAC-12（Phase 1.1 — CSV 解析与校验 API）。
- 分支：`iter/1`，从 `dev` 的 `7b3c2f1` 创建。
- 已完成：
  - `POST /api/datasets/csv` 接收 multipart CSV，返回 `row_count`、`columns`、`numeric_columns`、`preview`（前 10 行）和 `warnings`。
  - 对缺失值、重复行、本应为数值的列出现非数值、非有限值给出警告；预览中的缺失/非有限值序列化为 `null`。
  - 明确 4xx：空文件 400、内容类型不支持 415、只有表头/格式错误/结构不规则 422、超过上限 413。
  - 解析前先拒绝不规则行，避免 pandas 静默移位或丢字段。
  - 支持 UTF-8（含 BOM）、CRLF、带引号逗号和带引号换行。
  - 新增 19 个数据集测试，包括不规则行回归和引号字段用例。
- 审查发现：第一版 `e2012ad` 在单行多一个字段时会静默移位。Lead 复现后打回，Dev 在 `fba7414` 用字段数校验和回归测试修复；首次提交未合并。
- 测试：
  - 后端：`ruff check app tests` 通过；`pytest -q` 通过（35 个测试）。
  - 前端：未改动；QA 重跑 `pnpm typecheck`、`pnpm test:run`（2 个通过）和 `pnpm build` 成功。
- 独立 QA：MAC-16，DeepSeek Worker QA，结论 **PASS**，完成 22 个独立端点探测；确认远端 SHA、diff 范围、验收标准、不规则行拒绝、引号字段和确定性本地解析。
- Git：
  - `iter/1` 功能提交：`e2012adf929602eaa03ab99585270d8d45e95dad`（初始 CSV 导入接口）。
  - `iter/1` 修复提交：`fba741408e8b97e8d04a008a420d4e68e7edbc77`（拒绝不规则行与非有限警告）。
  - 最终功能链接：https://github.com/CubicZnS/labflow/commit/fba741408e8b97e8d04a008a420d4e68e7edbc77
  - `dev` 合并提交：`0c9f89560b0369edf9f620c1400241db2dc8fd19`
  - 合并链接：https://github.com/CubicZnS/labflow/commit/0c9f89560b0369edf9f620c1400241db2dc8fd19
- 已知限制：
  - 仅支持 CSV；尚未实现 XLSX。
  - 仅支持逗号分隔 UTF-8；其他分隔符和编码暂不支持。
  - 上传上限 10 MB，且整文件在大小检查前已读取。
  - 尚无前端上传/预览 UI；`numeric_columns` 会排除任意含文本的列。
- 下一轮：Phase 1.2 — CSV 上传与预览 UI（MAC-13）。

## 迭代 #2 — Phase 1.2 CSV 上传与预览 UI

- 日期：2026-10-21
- 目标：把迭代 1 的 CSV API 接到产品 UI，让用户上传文件并在分析前检查解析结果。
- 任务：MAC-13（Phase 1.2 — CSV 上传与预览 UI）。
- 分支：`iter/2`，从 `dev` 的 `f989508` 创建。
- 已完成：
  - CSV 上传面板：文件选择、文件名/大小、清除、解析中状态并禁止重复提交。
  - 通过类型化 API helper 以 multipart `file` 上传到 `POST /api/datasets/csv`。
  - 成功视图显示行数、数值列、警告或无警告状态，以及前 10 行预览表。
  - 缺失（`null`）单元格显示可访问的 `—` 占位。
  - 失败时读取 API JSON 的 `detail` 显示可读错误；非 JSON 响应有 HTTP 状态兜底；页面不崩溃。
  - 新增确定性示例数据 `frontend/public/samples/labflow-demo.csv`（12 行）和下载链接。
  - 保留健康检查和页面骨架；继续中文优先和响应式布局。
- 测试：
  - 前端：`pnpm typecheck` 通过；`pnpm test:run` 通过（6 个测试，覆盖上传成功、无警告、API 错误 detail、非 JSON 兜底）；`pnpm build` 成功。
  - 后端：本轮未改动；QA 确认 `ruff check app tests` 通过、`pytest -q` 通过（35 个测试）。
  - 实际 QA：示例 CSV 上传本地 uvicorn 返回 200，`row_count=12`、3 个数值列、10 行预览、2 条缺失值警告；畸形 CSV 返回预期 422。
- 独立 QA：MAC-18，DeepSeek Worker QA，结论 **PASS**；确认远端 SHA、5 文件 diff、验收标准、前后端测试和真实端点行为。
- Git：
  - `iter/2` 功能提交：`80895d170df4b7efadbfe02cf6e3380232bf842e`（CSV 上传与预览 UI）。
  - 功能链接：https://github.com/CubicZnS/labflow/commit/80895d170df4b7efadbfe02cf6e3380232bf842e
  - `dev` 合并提交：`6ed7e07f4eb3ebaafb3452522cfcac8a17b7a074`
  - 合并链接：https://github.com/CubicZnS/labflow/commit/6ed7e07f4eb3ebaafb3452522cfcac8a17b7a074
- 已知限制：
  - 仅 CSV；XLSX、手工表格编辑、列/单位选择尚未实现。
  - 尚未计算统计量；UI 止步于校验后的预览。
  - 迭代 1 的 10 MB 限制和 UTF-8/逗号限制仍适用。
  - 警告在中文 UI 中仍是 API 返回的英文原文。
- 下一轮：Phase 1.3 — 导入数据的数值列选择和基础统计（均值、样本标准差、标准误）。

## 迭代 #3 — Phase 1.3 导入数值列的汇总统计

- 日期：2026-10-21
- 目标：把导入数据接到确定性汇总统计，让用户查看数值列的 n、均值、样本标准差和标准误。
- 任务：MAC-14（Phase 1.3 — 导入数值列的汇总统计）。
- 分支：`iter/3`，从 `dev` 的 `ca0c4e319135c0eddb46ac96693da306d9552eaf` 创建。
- 已完成：
  - `POST /api/datasets/csv` 新增 `column_stats`，按数值列名返回 `n`、`missing`、`mean`、样本 `std`（ddof=1）和 `sem`。
  - 统计基于完整解析数据，而非 10 行预览；缺失/非有限值排除并计入 `missing`。
  - 少于 2 个有限值的数值列不进入 `column_stats`；既有响应字段、警告、错误和 API 路径不变。
  - 前端新增数值列选择器（默认第一列）和统计面板，显示 n、均值、样本标准差和 SEM，保留 4 位有效数字，极大/极小值用指数形式。
  - 明确显示缺失/非有限排除数、无数值列空状态、有效值不足说明。
  - 范围决策：本轮统计是单变量，所以选择数值 Y 列，而非 X/Y；X/Y 配对留到 Phase 2。
- 测试：
  - 后端：`ruff check app tests` 通过；`pytest -q` 通过（39 个测试，新增 4 个统计测试）。
  - 前端：`pnpm typecheck` 通过；`pnpm test:run` 通过（9 个测试，新增 3 个统计测试）；`pnpm build` 成功。
  - Lead API 探测：值 2、4、8 加 2 个缺失值，返回 `n=3`、`missing=2`、`mean=4.666666666666667`、`std=3.055050463303893`、`sem=1.7638342073763937`，与样本统计一致。
- 独立 QA：MAC-20，DeepSeek Worker QA，结论 **PASS**；确认远端 SHA、6 文件 diff、验收标准、前后端测试，以及已知值、缺失/非有限、过稀疏列和 12 行全量统计端点探测。
- Git：
  - `iter/3` 功能提交：`39baa39ff85688688ad00c1199521b801f3875d5`（确定性列汇总统计）。
  - 功能链接：https://github.com/CubicZnS/labflow/commit/39baa39ff85688688ad00c1199521b801f3875d5
  - `dev` 合并提交：`4868c1e8e92217fa11a892ba42e6f64a1897bb35`
  - 合并链接：https://github.com/CubicZnS/labflow/commit/4868c1e8e92217fa11a892ba42e6f64a1897bb35
- 已知限制：
  - 仅 CSV；XLSX、手工表格编辑、X/Y 配对/单位尚未实现。
  - 仅描述统计；尚无拟合或绘图。
  - 缺失/非有限值在计算中排除并在 UI 计数；没有逐行诊断表。
  - 迭代 1 的 10 MB 限制和 UTF-8/逗号限制仍适用。
  - 解析警告在中文 UI 中仍是英文原文。
- 下一轮：Phase 1.4 — XLSX 导入，保持与 CSV 相同的校验、预览、警告和统计契约。
## 迭代 #4 — Phase 1.4 XLSX 导入与 CSV 校验契约

- 日期：2026-10-21
- 目标：让用户导入真实实验 XLSX 工作簿，并获得与 CSV 相同的校验、预览、警告、数值列和汇总统计。
- 任务：MAC-22（Phase 1.4 — XLSX 导入与 CSV 校验/统计契约）。backlog 中没有 Phase 1.4 任务，因此按路线图创建。
- 分支：`iter/4`，从 `dev` 的 `bf17768ea3970aa9cfab606a3237376f324651c0` 创建。
- 已完成：
  - `POST /api/datasets/xlsx` 通过共享的 frame 构建管线返回既有数据集契约（`row_count`、`columns`、`numeric_columns`、`column_stats`、`preview`、`warnings`），避免 CSV/XLSX 在校验、警告顺序、数值识别、统计和 JSON 安全预览上漂移。
  - 确定性的首个工作表策略，并用一条警告说明导入的工作表名和总工作表数；只有表头或空工作表返回 422。
  - XLSX 错误：空字节 400、超过 10 MB 413、内容类型不支持 415、损坏或无数据工作簿 422；接受 XLSX OOXML 和 `application/octet-stream`。
  - 空表头和重复表头确定性去重。表头宽度取最宽的有数据行，因此有数据支撑的空表头列会保留；全空尾列丢弃；更宽的全空首行不会制造幻影列。
  - 后端依赖新增 `openpyxl>=3.1,<4`；本地安装和 CI 都从 `backend/pyproject.toml` 安装。
  - 前端上传面板接受 `.csv` 和 `.xlsx`，按扩展名路由，请求前拒绝不支持扩展名，显示解析格式，并更新中文 CSV-only 文案。
  - 测试用 openpyxl 在内存构造 XLSX，不提交二进制 fixture。
- 审查与 QA 发现：
  - MAC-23 首轮 QA **FAIL**：`["x","x.1","x"]` 这类重复表头产生重复标签并返回 HTTP 500。`7446abb` 修复后打回 Dev，未合并。
  - MAC-24 第二轮 QA **FAIL**：可选的幻影列修复把空表头单元格也裁掉，导致 `["x", null]` 下方有数据时返回 422，而 CSV 不会。`fcf7139` 修复后再次打回 Dev，未合并。
  - MAC-25 第三轮 QA **PASS**：独立 worktree 验证远端 SHA、diff 范围、两个历史缺陷、原始契约、模糊表头、错误状态和 CSV 回归。
- 测试：
  - 后端：`ruff check app tests` 通过；`pytest -q` 通过（66 个测试，50 个数据集测试）。
  - 前端：`pnpm typecheck` 通过；`pnpm test:run` 通过（11 个测试）；`pnpm build` 成功。
  - QA 实际探测确认已知值统计、全量数据计算、10 行预览、缺失/重复/非数值/非有限警告、多工作表策略、全部文档化错误状态、纯数值和纯字符串的 CSV 对等性，以及前端端点路由。
- 独立 QA：MAC-25，DeepSeek Worker QA，结论 **PASS**。
- Git：
  - `iter/4` 功能提交：`f2e94cbe0186a8f1578f8801573bef37a4722a7f`（XLSX 导入与共享校验契约）。
  - `iter/4` 修复提交：`7446abbf5bb3940726477631f827e1997c0b5593`（重复表头冲突安全）。
  - `iter/4` 修复提交：`fcf7139c1bb1268e125f8c66520f0ea9377a9235`（保留有数据支撑的空表头列）。
  - 最终功能链接：https://github.com/CubicZnS/labflow/commit/fcf7139c1bb1268e125f8c66520f0ea9377a9235
  - `dev` 合并提交：`746d502aecdd60d6e8bf98320404a3b667ae3bf4`
  - 合并链接：https://github.com/CubicZnS/labflow/commit/746d502aecdd60d6e8bf98320404a3b667ae3bf4
- 已知限制：
  - 只导入第一个工作表；尚无工作表选择器。
  - 公式单元格使用缓存值（`data_only=True`）；没有缓存结果的公式显示为缺失值。
  - 完全空白的表头行会被跳过，第一行数据成为表头。
  - XLSX 混合类型单元格可能原生序列化数字，而 CSV 返回字符串；列、统计和警告仍保持一致。
  - 手工表格录入/编辑和带单位的 X/Y 选择尚未实现。
  - 10 MB 限制仍适用，且文件在大小检查前已读取。
- 下一轮：Phase 1.5 — 导入数据的 X/Y 列选择和单位标签，这是 Phase 2 拟合和 Phase 3 绘图的桥梁。

## 迭代 #5 — Phase 1.5 X/Y 配对与单位

- 日期：2026-10-21
- 目标：让用户从导入的 CSV/XLSX 选择 X/Y 列、可选填写单位，并得到拟合和绘图可消费的显式配对序列。
- 任务：MAC-27（Phase 1.5 — X/Y 列配对、单位标签与配对序列提取）。backlog 中没有 Phase 1.5 任务，因此按路线图创建。
- 分支：`iter/5`，从 `dev` 的 `8c5aeb98d2ba743d3895f6782c21571fb698ca51` 创建。
- 已完成：
  - `POST /api/datasets/series` 接收 multipart `file`、`format`（csv/xlsx）、`x_column`、`y_column` 和可选 `x_unit`/`y_unit`，返回配对序列契约：`x_column`、`y_column`、trim 后单位或 null、`row_count`、`pair_count`、`skipped_count`、按文件顺序的每个有效 `pair`、配对值的 `x_stats`/`y_stats` 和警告。
  - 只保留两列都能转为有限浮点数的行；其他行跳过并计数，除导入警告外再给一条配对警告。
  - CSV 和 XLSX 共享 frame loader，避免两种格式在校验、警告顺序、数值识别和统计上漂移。
  - 错误：未知或相同列、非数值列、有效配对少于 2、单位超过 32 字符、格式不支持均 422；内容类型 415、空文件 400、超限 413、畸形文件 422 与导入端点一致。
  - 前端在成功导入后新增 `X/Y 配对与单位`：仅数值 X/Y 下拉、默认值、可选单位（最多 32）、不同列守卫、加载/禁用状态、中文错误、数值列不足提示，以及配对/跳过数、单位和前 10 对预览。
  - 新增类型化 `createSeries` 客户端和 `SeriesResponse` 类型；无新依赖。
- 审查与 QA 发现：
  - MAC-28 首轮 QA **FAIL**：XLSX datetime 列能通过 `pd.to_numeric`，被转成 epoch 纳秒并返回 200，而等价 CSV ISO 日期列返回 422。任务打回 Dev，`dev` 未合并。
  - 修复 `ae91783` 在 series 数值检查中拒绝 datetime64/timedelta64，并新增 4 个回归测试（XLSX datetime X/Y、CSV ISO 日期、数值 XLSX 成功）。
  - MAC-29 复核 **PASS**：独立 worktree 验证新 SHA、D1 复现、完整对抗用例、导入端点与 `dev` 的字节级一致性，以及全部 gate。
- 测试：
  - 后端：`ruff check app tests` 通过；`pytest -q` 通过（91 个测试，24 个 series 测试）。
  - 前端：`pnpm typecheck` 通过；`pnpm test:run` 通过（15 个测试，4 个配对测试）；`pnpm build` 成功。
- 独立 QA：MAC-29，DeepSeek Worker QA，结论 **PASS**。
- Git：
  - `iter/5` 功能提交：`1c9541dbaff2490dbb46df0d925a73ccae2ba0f5`（X/Y 配对、单位与配对提取）。
  - `iter/5` 修复提交：`ae917839a7cff2ba595e4d93285dd820a9795a3a`（拒绝 datetime/timedelta 作为数值列）。
  - 最终功能链接：https://github.com/CubicZnS/labflow/commit/ae917839a7cff2ba595e4d93285dd820a9795a3a
  - `dev` 合并提交：`760a30a2071e9928c42235269fbf29bf9bcb19d3`
  - 合并链接：https://github.com/CubicZnS/labflow/commit/760a30a2071e9928c42235269fbf29bf9bcb19d3
- 已知限制：
  - `/api/datasets/series` 接受布尔列为 0/1，而导入端点会把布尔列排除出 `numeric_columns`；前端未暴露该行为。
  - 混合数字和日期的 object 列会配对数字行并跳过日期行，而不是整列拒绝。
  - 只导入第一个 XLSX 工作表；尚无工作表选择器。
  - 10 MB 限制仍适用，文件在大小检查前已读取。
  - 手工表格录入/编辑仍未实现，推迟到拟合/绘图之后。
  - `frontend/src/lib/api.ts` 缺少末尾换行（仅外观问题）。
- 下一轮：Phase 2.1 — 在选中的 X/Y 序列上做线性拟合，显示方程、R² 和残差，复用既有确定性 `linear_fit`。

## 迭代 #6 — Phase 2.1 数据集拟合（线性、二次、三次）

- 日期：2026-10-21
- 目标：让用户直接从导入的 CSV/XLSX 对选中 X/Y 序列做 1–3 次拟合，查看方程、R²、系数、残差诊断和残差预览。
- 任务：MAC-31（Phase 2.1 — 数据集拟合接口与拟合面板）。backlog 无就绪任务，因此按路线图创建并分配给 Dev。
- 分支：`iter/6`，从 `dev` 的 `7060ed023a875df54716d59bfbb4b62cc758d92f` 创建。
- 已完成：
  - `POST /api/datasets/fit` 接收 multipart `file`、`format`、`x_column`、`y_column`、`degree`（默认 1，允许 1–3）和可选 `x_unit`/`y_unit`。
  - 端点复用 `build_series` 做解析、列校验、时间列拒绝、配对、跳过计数、单位和警告，并复用 `linear_fit`/`polynomial_fit` 做最小二乘；不重复实现最小二乘或 CSV/XLSX 解析。
  - 响应新增 `DatasetFitResponse`：列名、单位、行/配对/跳过数、degree、系数（最高次在前）、方程、R²、pairs、拟合值、残差、RMSE、最大绝对残差和警告；`fitted`、`residuals`、`pairs` 按文件顺序对齐。
  - 校验：degree 非法/非整数/越界 422；欠定 `pair_count <= degree` 422；常量 X 422；未知/相同/非数值列 422；单位超过 32 字符 422；格式不支持 422；内容类型 415、空文件 400、超过 10 MB 413、畸形文件 422，与导入/series 端点一致。
  - 前端新增类型化 `createFit` 客户端，以及仅在 series 成功后渲染的 `FitPanel`：线性/二次/三次选择、加载/禁用、中文错误、方程、4 位小数 R²、系数、RMSE、最大绝对残差和前 10 行预览（X、Y、拟合值、残差）及行数说明。
  - 成功后新 series 通过 `key` 重挂载拟合面板，清空旧结果。
  - 无新依赖；既有导入和 series 行为不变。
- 审查与 QA 发现：
  - Lead 验证远端分支和 `gh api` SHA `a461da1`，审查完整 diff（`7060ed0..a461da1`：8 个允许文件，+1004/−1），并在 QA 前独立运行全部 gate。
  - MAC-32 QA **PASS**：独立确认已知值系数与 `numpy.polyfit`/闭式解一致、残差恒等式 `fitted + residual == y`、噪声 fixture 的 RMSE 和最大残差、CSV/XLSX 载荷一致、与 `/api/datasets/series` 的警告一致、完整错误矩阵（含 10 MB 限制）、导入/series 端点相对 `dev` 的字节级回归、源顺序配对，以及前端 FormData/渲染/重置行为。
  - QA 非阻断观察：显式空的 `degree` 表单值被当作省略并默认 1（`" "` 正确返回 422）；中文 UI 内后端 422 消息仍为英文；成功拟合后更改 degree 会保留旧结果直到再次运行。
- 测试：
  - 后端：`ruff check app tests` 通过；`pytest -q` 通过（116 个测试，新增 25 个拟合测试）。
  - 前端：`pnpm typecheck` 通过；`pnpm test:run` 通过（22 个测试，新增 7 个拟合测试）；`pnpm build` 成功。
- 独立 QA：MAC-32，DeepSeek Worker QA，结论 **PASS**。
- Git：
  - `iter/6` 功能提交：`a461da1d5216c15a313bf834802e43bed05d0951`（数据集多项式拟合接口与拟合面板）。
  - 功能链接：https://github.com/CubicZnS/labflow/commit/a461da1d5216c15a313bf834802e43bed05d0951
  - `dev` 合并提交：`48a3440c2b010ee5dc74587076b32de3ac700841`
  - 合并链接：https://github.com/CubicZnS/labflow/commit/48a3440c2b010ee5dc74587076b32de3ac700841
- 已知限制：
  - 尚无系数标准误、置信区间或测量误差/误差棒支持；不确定度传播仍未完成。
  - 没有病态拟合警告；只拒绝欠定拟合。
  - 空 `degree` 表单值默认 1，而不是拒绝。
  - 中文 UI 内服务端校验消息仍为英文。
  - 拟合后更改 degree 会保留旧结果直到下一次运行。
  - 继承限制：series/fit 接受布尔列为 0/1；混合 object 列跳过日期行；仅导入第一个 XLSX 工作表；10 MB 文件在大小检查前读取；手工表格录入仍未实现。
- 下一轮：Phase 2.2 — 拟合不确定度与条件诊断：系数标准误、95% 置信区间和显式病态拟合警告，使用已知值和独立数值基线；随后 Phase 2.3 加入 Y 误差列和误差棒输入。

## 迭代 #7 — Phase 2.2 拟合不确定度与条件诊断

- 日期：2026-10-21
- 目标：让拟合结果如实报告不确定度和数值警告，使用户能判断系数是否可信，而不是只看点估计和 R²。
- 任务：MAC-34（Phase 2.2 — 拟合系数标准误、95% CI 和病态诊断）。backlog 无就绪任务，因此按路线图创建并分配给 Dev；QA 为 MAC-35。
- 分支：`iter/7`，从 `dev` 的 `201d2447cf30cc6b3921a1cd0eabf48152726104` 创建。
- 已完成：
  - `POST /api/datasets/fit` 在既有字段外新增类型化 `uncertainty` 对象：`residual_dof`、`standard_errors`、`confidence_intervals`、`condition_number`、`ill_conditioned`；既有顶层字段、顺序和错误行为不变。
  - 不确定度复用共享确定性最小二乘结果：`mse = SSR / residual_dof`、`cov = mse * pinv(XᵀX)`、系数标准误取协方差对角线、95% 双侧 CI 用 `t.ppf(0.975, residual_dof)`；协方差数学只写在 `app/analysis.py`，线性和多项式拟合共用。
  - 恰好决定（`pair_count == degree + 1`）仍返回 HTTP 200，但标准误/CI 为 null 并给一条明确警告，而不是除零或编造不确定度。
  - 条件数使用单位缩放 Vandermonde 设计（`x / max(abs(x))`）的 2-范数条件数，因此仅改变 X 单位不会触发警告；非有限或 `> 1e12` 设为 `ill_conditioned` 并追加真实值警告。
  - `FitPanel` 新增中文优先的系数不确定度表（系数、标准误、95% CI 下限/上限）、残差自由度、条件数、条件警告，以及无法估计时用破折号单元格的说明。
  - 无新依赖；不改变 CSV/XLSX 解析、配对、`/api/datasets/series`、导入端点或 `/api/analysis/fit` 的响应形状。
- 审查与 QA 发现：
  - Lead 验证远端分支和 `gh api` SHA `291864d`，审查完整 diff（`201d244..291864d`：8 个允许文件，+572/−3），并在 QA 前独立运行全部 gate 和针对 `scipy.stats.linregress`/t CI 的数值探测。
  - MAC-35 QA **PASS**：独立重算线性/二次/三次标准误和 CI（偏差 < 3e-15）、精确拟合 null 路径、病态 fixture（条件数 1.227e17，JSON 安全）、单位缩放不变性、极端 X 量级、秩亏重复 X 拟合、14 个错误矩阵、端点回归和前端渲染/重置。
  - 非阻断观察：`backend/app/analysis.py` 仍缺末尾换行；病态 fixture 会从 `np.polyfit` 产生良性 numpy `RankWarning`；1e12 阈值是启发式；中文 UI 内后端校验消息和警告仍为英文。未发现缺陷。
- 测试：
  - 后端：`ruff check app tests` 通过；`pytest -q` 通过（126 个测试，新增 10 个不确定度测试）。
  - 前端：`pnpm typecheck` 通过；`pnpm test:run` 通过（25 个测试，新增 3 个不确定度测试）；`pnpm build` 成功。
  - 合并后在 `dev` 重跑同一组后端和前端 gate，全部通过后才提交迭代记录。
- 独立 QA：MAC-35，DeepSeek Worker QA，结论 **PASS**。
- Git：
  - `iter/7` 功能提交：`291864d0059c2edda9613a9af0ec777eb8c29b7c`（系数不确定度与条件诊断）。
  - 功能链接：https://github.com/CubicZnS/labflow/commit/291864d0059c2edda9613a9af0ec777eb8c29b7c
  - `dev` 合并提交：`2475463c467b6c9f8ff5a4756f8db342995c5c14`
  - 合并链接：https://github.com/CubicZnS/labflow/commit/2475463c467b6c9f8ff5a4756f8db342995c5c14
- 已知限制：
  - 不确定度是经典 OLS 协方差，假设 Y 误差独立同分布；尚无 Y 误差列、误差棒或测量误差传播。
  - 精确决定拟合按设计不暴露不确定度；UI 会解释而不是隐藏。
  - 病态阈值（1e12）是产品启发式，不是统计保证。
  - 拟合后更改 degree 会保留旧结果直到下次运行；中文 UI 内服务端警告仍为英文。
  - 继承限制：series/fit 接受布尔列为 0/1；混合 object 列跳过日期行；仅导入第一个 XLSX 工作表；10 MB 文件在大小检查前读取；手工表格录入仍未实现。
- 下一轮：Phase 2.3 — Y 误差列、误差棒和测量误差感知的不确定度，复用同一拟合/不确定度管线，明确加权规则和独立数值基线；之后 Phase 3 科学绘图可消费拟合线和误差数据。
## 迭代 #8 — Phase 2.3a Y 误差列与加权最小二乘拟合

- 日期：2026-10-21
- 目标：让带有测量不确定度的实验数据可以使用绝对 Y 误差列做加权拟合，并如实报告加权系数、误差传播、χ² 与约化 χ²，同时保持无误差列时的既有拟合结果完全不变。
- 任务选择：MAC-37（Phase 2.3a — Y 误差列、加权拟合与误差感知不确定度）。首次独立验收 MAC-38 判 **FAIL**；修复任务 MAC-39 完成后，复核任务 MAC-40 判 **PASS**。
- 分支：`iter/8`，从 `dev` 的 `4168609ed943ea74a9cd49e24f38220d54c3feb7` 创建。
- 已完成：
  - `POST /api/datasets/fit` 新增可选表单字段 `y_error_column` 与 `y_error_unit`。不提交时维持 Phase 2.2 的等权拟合；显式空串/空白串误差列返回 422，不会静默退化为等权；只提交单位而不提交误差列返回 422。
  - 误差列按现有 X/Y 配对规则校验：仅校验保留配对行；缺失、非有限、≤0 的 σ、与 X/Y 同列、不存在或非数值列均返回 422 并给出列名与数量；`1/σ²` 非有限同样 422。单位沿用现有规则：trim、空白为 `null`、超过 32 字符 422。
  - 加权求解集中在 `app/analysis.py` 的 `_weighted_least_squares`：系数为 `lstsq(X·√w, y·√w)`；绝对误差协方差 `pinv(XᵀWX)`，不乘 MSE；标准误与 95% CI 仍用 `t.ppf(0.975, residual_dof)`；`residual_dof = n − (degree + 1)`，为 0 时 SE/CI 为 `null`。
  - `χ² = Σ wᵢrᵢ²`，`reduced_chi_squared = χ² / residual_dof`（仅加权且 dof > 0）。`rmse`、`max_abs_residual`、`r_squared` 保持未加权定义；条件数与 `ill_conditioned` 规则不变。未加权路径与 Phase 2.2 数值一致。
  - 响应新增 `weighted`、`y_error_column`、`y_error_unit`、`y_errors`（与 `pairs` 同序对齐）、`chi_squared`、`reduced_chi_squared`；加权且约化 χ² 不在 `[0.1, 10]` 时追加一条确定性警告。JSON 不输出 NaN/Infinity。
  - 前端 `FitPanel` 新增中文优先的 Y 误差列下拉（排除 X/Y，默认“不使用（等权拟合）”）、单位输入（maxLength 32）、加权/等权标识、误差列/单位、χ²/约化 χ² 展示，以及预览表“Y 误差”列；新 series 仍重置拟合结果。
- 审查与验收发现：
  - Lead 独立复核 diff、远端 SHA 与全部 gate，并用自建 n=30、非均匀 σ 的 fixture 对 `scipy.optimize.curve_fit(absolute_sigma=True)` 校验，系数与 SE 偏差 ≤ 4.5e-9。
  - MAC-38 发现两个问题：(1) `y_error_column=""` 与单独 `y_error_unit=""` 返回 200，误差列被静默丢弃；(2) 认为分支缺少中文迭代记录。代码缺陷经 Lead 复现后由 MAC-39 修复；中文记录项按流程由 Lead 在 QA PASS 后创建合并/记录 commit 补齐，本轮记录、merge commit 与记录 commit 均为中文。
  - MAC-40 复核确认 7 条空串/单位行为、multipart 读取、WLS 数值、回归路径与全部 gate 通过，无缺陷，判 **PASS**。
- 测试：
  - 后端：`ruff check app tests` 通过；`pytest` **155 passed**（新增加权数值基线、精确决定、对齐、校验矩阵、警告阈值、CSV/XLSX 一致性及空串回归）。
  - 前端：`pnpm typecheck` 通过；`pnpm test:run` **30 passed**；`pnpm build` 成功。
  - 合并后在 `dev` 上重跑同一组后端与前端 gate，全部通过后才提交本记录。
- 独立 QA：MAC-40，DeepSeek Worker QA，结论 **PASS**（MAC-38 首轮 **FAIL** 已闭环）。
- Git：
  - `iter/8` 功能提交：`7c47690349717fafae2465494391cbfd0b5d1080`
    https://github.com/CubicZnS/labflow/commit/7c47690349717fafae2465494391cbfd0b5d1080
  - `iter/8` 修复提交：`93a10139e07168357ea314348d9ae39b3bee722f`
    https://github.com/CubicZnS/labflow/commit/93a10139e07168357ea314348d9ae39b3bee722f
  - `dev` 合并提交：`7b2fbcb25191c1505340d8701ce9573ae543065a`
    https://github.com/CubicZnS/labflow/commit/7b2fbcb25191c1505340d8701ce9573ae543065a
- 已知限制：
  - 加权拟合把提供的 σ 视为绝对值并假设误差相互独立；不估计额外方差缩放。
  - 拟合曲线与误差棒尚未在图表中绘制（属于 Phase 3）。
  - 更改误差列后，之前输入的单位仍会保留（仅 UX 陈旧，不影响计算）。
  - 直接调用 `linear_fit`/`polynomial_fit` 并传入 `inf` σ 会产生 0 权重而不报错；HTTP 端点会正确拒绝，因此用户不可达。
  - 服务端校验消息与警告仍为英文（中文 UI 内），沿用历史限制。
  - 继承限制：布尔列按 0/1 参与拟合；混合对象列会跳过日期行；仅导入第一个 XLSX worksheet；10 MB 文件在大小检查前已被读取；手工表格录入仍未实现。
- 下一轮：Phase 3.1 — 科学绘图第一步：基于已配对 X/Y 系列渲染 SVG 散点图，包含轴标签/单位、自动范围与空数据/单点提示，不新增第三方图表依赖；随后 3.2 叠加拟合曲线与 Y 误差棒，3.3 多系列与样式控制，3.4 PNG/SVG 导出。
## 迭代 #9 — Phase 3.1 SVG 散点图

- 日期：2026-10-22
- 目标：在既有 X/Y 配对结果上渲染确定性的 SVG 散点图，让用户第一次看到数据的图形形态；只做散点图，不引入拟合线、误差棒、多系列、导出或样式面板。
- 任务选择：MAC-42（Phase 3.1 — SVG 散点图渲染与自动坐标范围）。
- 分支：`iter/9`，从 `dev` 的 `8220531ad5fa501493bffd697f2ef224a25685d9` 创建。
- 已完成：
  - 新增 `frontend/src/components/ScatterPlot.tsx`：使用内联 SVG（`viewBox` + 100% 宽度）绘制散点，不新增依赖。
  - 自动范围：仅基于有限数据点计算 X/Y 域并留出约 5% 边距；单点或全相同值会扩展为零宽度域，坐标始终为有限数。
  - 刻度：确定性“nice”步长生成 4–6 个刻度，数字在常规量级使用可读小数，极大/极小值使用紧凑科学计数法，避免 `1e-17` 噪声。
  - 轴标签：显示列名，存在单位时显示 `列名 (单位)`，无单位时只显示列名，不产生空括号。
  - 数据点：每个有限配对点一个 `<circle data-testid="scatter-point">`，带原始 `data-x`/`data-y`；SVG 根节点暴露 `data-testid="scatter-plot"`、域属性和 `data-point-count`。
  - 退化输入：0 点显示中文空状态且不渲染坐标轴/圆点；1 点仍绘制并提示“仅 1 个数据点，无法判断趋势”；非有限点被过滤。
  - 可访问性：`role="img"` 与含中文说明和数据点数量的 `aria-label`，并以图例文字说明圆点含义，不只依赖颜色。
  - `SeriesPanel` 在 series 成功后、配对预览表之前渲染散点图，直接使用 `pairs`/列名/单位；重新上传或重新生成 series 时随新结果更新。
  - `App.tsx` 将过时的 “Phase 1 · 数据导入” 更新为 “Phase 3 · 科学绘图”，路线图如实说明散点图已可用，拟合线/误差棒/导出仍待完成。
- 测试：
  - 前端 `ScatterPlot.test.tsx` 覆盖：点数与 data 属性一致；轴标签含单位且无空括号；自动域含边距且刻度落在域内、数量 4–6；全相同 X/Y 时 `cx`/`cy` 有限；0 点空状态、1 点提示；非有限点过滤。
  - 前端 `App.test.tsx` 覆盖：series 成功后散点图出现且点数等于 `pair_count`；重新选择并生成 series 后点数更新、不残留旧点；未生成 series 时不渲染散点图。
  - 命令与结果：
    - `cd frontend && /Users/zhangzimo/.local/bin/pnpm typecheck` 通过。
    - `cd frontend && /Users/zhangzimo/.local/bin/pnpm test:run` **40 passed**（新增 7 个 ScatterPlot 测试 + 3 个 App 集成测试）。
    - `cd frontend && /Users/zhangzimo/.local/bin/pnpm build` 成功。
    - `cd backend && .venv/bin/python -m pytest -q` **155 passed**。
    - `cd backend && .venv/bin/ruff check app tests` 通过。
- Git：
  - `iter/9` 功能提交：`94e8067f35670c40ae9234dca4f94e3703fecada`
    https://github.com/CubicZnS/labflow/commit/94e8067f35670c40ae9234dca4f94e3703fecada
  - `iter/9` 修复提交：`9832aa86bc815223fc8f48e91cb15e80647855fe`
    https://github.com/CubicZnS/labflow/commit/9832aa86bc815223fc8f48e91cb15e80647855fe
  - 独立 QA：MAC-44 判定 **PASS**（F1/F2/F3 复验通过，全量 gate 通过）。
  - 合并提交（dev）：`28629942e02db72ec7ff1fb8eeb14264ee6f9f03`
    https://github.com/CubicZnS/labflow/commit/28629942e02db72ec7ff1fb8eeb14264ee6f9f03
  - 迭代记录提交（dev）：`c525eac9ea5aa293caddd4fc95d74e49106e282e`
    https://github.com/CubicZnS/labflow/commit/c525eac9ea5aa293caddd4fc95d74e49106e282e
    （其后另有中文推送时间校准提交。）
- 已知限制：
  - 仅绘制 X/Y 配对点；尚无拟合线叠加、Y 误差棒、多系列、样式面板或 PNG/SVG 导出（留待 3.2–3.4）。
  - 自动范围与刻度是确定性启发式，不提供手动缩放或坐标范围编辑。
  - 散点图为内联 SVG，数据量大时仍会渲染全部圆点，暂无抽稀或分页。
  - 继承限制：布尔列按 0/1 参与配对；混合对象列会跳过日期行；仅导入第一个 XLSX worksheet；10 MB 文件在大小检查前已被读取；手工表格录入仍未实现；中文 UI 内部分服务端校验消息/警告仍为英文。
- 下一轮：Phase 3.2 — 在散点图上叠加拟合曲线与 Y 误差棒，复用已有拟合/误差数据，保持确定性坐标范围与可访问性。

### 迭代 #9 修复 — 独立 QA FAIL 闭环

- 触发：MAC-43 独立 QA 判 **FAIL**，发现单点/单轴全同值时刻度数不足、极端有限值域溢出，以及 README 时间与记录 commit 不一致。
- 修复：
  - F1：`generateTicks` 改为从 `1/2/2.5/5 × 10^n` 候选步长中选择刻度数落在 4–6 的方案；若候选步长无法直接落在边距域内，则按最小幅度向外扩展到刻度边界，确保单点和全同值轴也维持 4–6 个刻度。
  - F2：单点扩展域与极值数据钳制到可表示范围；跨度溢出时改用半区间安全比例与有限插值刻度，`Number.MAX_VALUE`/`-Number.MAX_VALUE` 不再产生 Infinity 域或 NaN 坐标。
  - F3：README 迭代 #9 推送时间先校准为修复记录 commit 的真实时间 `2026-10-22 00:03`；合并后的迭代记录提交 `c525eac` 于 `2026-10-22 00:11`，README 已按该提交时间与 SHA 标注。
  - 新增测试：单点 X/Y 刻度数、Y 全同值刻度数、极端有限值域与坐标有限性（含无 NaN/Infinity 控制台告警断言）。
- 测试：
  - `pnpm typecheck` 通过；`pnpm test:run` **43 passed**；`pnpm build` 成功。
  - `pytest -q` **155 passed**；`ruff check app tests` 通过。
- Git：
  - `iter/9` 修复提交：`9832aa86bc815223fc8f48e91cb15e80647855fe`
    https://github.com/CubicZnS/labflow/commit/9832aa86bc815223fc8f48e91cb15e80647855fe

## 迭代 #10 — Phase 3.2 拟合曲线叠加与 Y 误差棒

- 日期：2026-10-22
- 目标：在迭代 #9 的单系列 SVG 散点图上叠加拟合曲线，并在加权拟合时绘制 Y 误差棒；保持确定性坐标范围、中文优先与无新增图表依赖，不改后端契约。
- 任务选择：MAC-46（Phase 3.2 — 散点图叠加拟合曲线与 Y 误差棒）。Lead 独立审查首版 `ff3b90d` 后发现两个阻断缺陷，创建 MAC-47 退回 Dev 修复；修复提交 `dd83630` 已推送并核验。独立 QA 任务待创建。
- 分支：`iter/10`，从 `dev` 的 `f85a9215d5419c35308f14ec67b37611e8c562ae` 创建。
- 已完成：
  - `ScatterPlot` 新增可选 `fit` 属性。拟合成功后按 `coefficients` 在可见 X 域（含约 5% 边距）确定性采样 101 点，输出 `<polyline data-testid="fit-curve">`，并暴露采样数、次数与 X 域端点；不新增第三方依赖。
  - 加权拟合（`weighted === true` 且 `y_errors` 非空）时，为每个有限配对点绘制 `y ± σ` 垂直误差棒和上下短帽（`data-testid="error-bar"`）；非有限 σ 或端点被跳过，不影响其他点。
  - 自动 Y 范围同时纳入有限数据点、误差棒端点与拟合曲线采样值，保持约 5% 边距和 4–6 个刻度；无拟合、无误差棒时坐标域与迭代 #9 一致。高次拟合曲线不再越过坐标轴或标签。
  - `SeriesPanel` 持有当前 series 的成功拟合结果，`FitPanel` 通过 `onFitChange` 上送；用 `seriesRun` 代次令牌隔离旧请求，新 series 开始与成功时都清空旧拟合，卸载后的异步回调被忽略。修复了“旧 series 拟合结果回写新 series”的竞态。
  - 图例在存在拟合曲线/误差棒时显示中文说明；`aria-label` 说明叠加内容；散点、空数据、单点、轴标签与单位行为保持不变。
  - 同步更新中文 README（当前状态、能力、测试数量、限制、下一轮与版本迭代记录表）和 Phase 3 页面文案。
- 审查与修复发现：
  - Lead 核验远端 `iter/10` 与 `gh api` SHA；首版 diff 仅涉及 5 个前端文件，后端未改动。
  - 首版审查缺陷 1：拟合请求挂起时重新生成 series，旧请求返回后仍写入新 series，产生不匹配曲线/误差棒。MAC-47 用 series 代次令牌 + 卸载守卫修复，并新增 `ignores a stale fit response from a previous series` 回归测试。
  - 首版审查缺陷 2：Y 域未包含拟合采样值，高次曲线在 X 边缘可能越过坐标轴或标签。MAC-47 将有限曲线采样纳入 Y 域，并新增三次拟合越界测试，断言曲线像素坐标始终位于内绘图区、刻度仍为 4–6 个。
- 测试：
  - 后端：`ruff check app tests` 通过；`pytest -q` **155 passed**。
  - 前端：`pnpm typecheck` 通过；`pnpm test:run` **52 passed**（新增拟合曲线、误差棒、Y 域扩展、越界曲线与旧结果隔离测试）；`pnpm build` 成功。
- 独立 QA：MAC-48，DeepSeek Worker QA，结论 **PASS**。5 项强制 gate 全部通过；独立核验三个远端 SHA、文件范围、中文 README/日志/版本表；独立数值探测确认三次拟合采样与闭式解最大误差 1.99e-13、误差棒端点与 `y±σ` 一致、曲线像素全部位于内绘图区。未发现缺陷，未修改被审代码或测试。
- 合并流程：QA PASS 后才合并 `iter/10` 到 `dev`；合并 commit 与迭代记录 commit 均使用中文摘要。合并前未推送 `dev`。
- Git：
  - `iter/10` 功能提交：`ff3b90d4b7d4e3c86913fb275f10c149c44dfc50`
    https://github.com/CubicZnS/labflow/commit/ff3b90d4b7d4e3c86913fb275f10c149c44dfc50
  - `iter/10` 修复提交：`dd836302ef7d67e58f4009942e75c7d08a322a89`
    https://github.com/CubicZnS/labflow/commit/dd836302ef7d67e58f4009942e75c7d08a322a89
  - `iter/10` 中文文档提交：`06b9516542b5b1b7e36958bbae2a4a673bbd18ab`
    https://github.com/CubicZnS/labflow/commit/06b9516542b5b1b7e36958bbae2a4a673bbd18ab
  - `dev` 合并提交：`f98b1c91467c865214c5bbd07a483c097aa93e9c`
    https://github.com/CubicZnS/labflow/commit/f98b1c91467c865214c5bbd07a483c097aa93e9c
  - 推送核验：`git ls-remote origin refs/heads/dev` 与 `gh api` 对合并 SHA 返回一致；`main` 未改动。
- 已知限制：
  - 仅支持单系列；尚无多系列、标题/图例/网格/字体/刻度样式控制，也无 PNG/SVG 导出（Phase 3.3–3.4）。
  - 拟合曲线覆盖可见 X 域（含 5% 边距），不提供手动坐标范围或采样点数控制。
  - 误差棒把输入的 σ 视为绝对误差并假设误差相互独立；误差棒端点超出可表示范围时跳过。
  - 数据量大时仍渲染全部散点；暂无抽稀或分页。
  - 继承限制：布尔列按 0/1 参与配对；混合对象列会跳过日期行；仅导入第一个 XLSX worksheet；10 MB 文件在大小检查前已被读取；手工表格录入仍未实现；中文 UI 内部分服务端校验消息/警告仍为英文。
- 下一轮：Phase 3.3 — 多系列叠加与基础样式控制（标题、图例、网格、字体/刻度），复用现有确定性坐标与拟合/误差渲染；随后 Phase 3.4 完成 PNG/SVG 导出。

## 迭代 #11 — Phase 3.3 图表标题与网格/刻度/字号样式控制

- 日期：2026-10-22
- 目标：在迭代 #10 的单系列 SVG 散点图（含拟合曲线与 Y 误差棒）之上，增加图表标题、网格开关、刻度密度与字号档位；只做前端确定性渲染，不改后端契约，不新增第三方依赖。
- 任务选择：MAC-50（Phase 3.3 — 图表标题与网格/刻度/字号样式控制）。
- 分支：`iter/11`，从 `dev` 的 `ed47e8fc2f9f6c5d103199a2d466bd46281c5ec1` 创建。
- 已完成：
  - `ScatterPlot` 新增 `title` 属性：非空标题以 `<text data-testid="chart-title">` 居中渲染在 SVG 顶部；空白标题不渲染元素且不预留额外布局，坐标与无标题时一致。标题文本由 React 文本节点安全转义，`aria-label` 同步包含当前标题。
  - 新增 `showGrid` 属性（默认 `false`）：开启后按当前 X/Y 刻度位置绘制 `data-testid="grid-line"` 虚线参考线，横向线数等于 Y 刻度数、纵向线数等于 X 刻度数；网格组位于散点、拟合曲线和误差棒之前（下层），不改变任何图形像素坐标。图例新增“虚线段为网格参考线”，与坐标轴以线型区分，不只依赖颜色。
  - 新增 `tickDensity` 属性：`sparse`（每轴 3–4 个刻度）、`standard`（4–6 个，默认，复用迭代 #10 算法保持完全一致）、`dense`（6–9 个）。稀疏/密集档从确定性候选步长中选择，优先使用域内刻度；退化域使用域内均匀分数刻度回退，保证刻度有限、唯一且落在坐标域内。
  - 新增 `fontScale` 属性：`small`/`medium`（默认）/`large`，分别改变标题、轴标签与刻度文字字号；不改变坐标域、点位、拟合曲线或误差棒像素坐标。默认中档字号与迭代 #10 完全一致（刻度 11、轴标签 12）。
  - `SeriesPanel` 新增“图表样式”控件区：中文“图表标题”文本框（最多 80 字符）、“显示网格”复选框、“刻度密度”和“字号”下拉框；状态保存在本地，实时驱动 `ScatterPlot`，不触发新的 series 请求。
  - 同步更新中文 README：当前状态、能力、测试数量、版本迭代表、已知限制与下一轮计划。
- 测试：
  - 后端：`ruff check app tests` 通过；`pytest -q` **155 passed**。
  - 前端：`pnpm typecheck` 通过；`pnpm test:run` **60 passed**（Phase 3.3 原有新增测试 + MAC-51 的 3 个刻度标签回归测试）；`pnpm build` 成功。
  - 新增覆盖：标题显示/隐藏、居中与 XML 转义；网格默认关闭、开关后线数与刻度一致、虚线样式、位于散点/曲线/误差棒下层且坐标不变；稀疏/密集档在常规、单点、X 全同值、Y 全同值与极端有限值下的刻度数、域内约束、唯一性与有限性；三档字号改变标题/轴标签/刻度字号且域与图形坐标不变；App 层控件实时更新且 series 只请求一次。

### Lead 复核修复（MAC-51）

- 缺陷：`tickDensity="dense"` 在“大数值 + 小跨度”数据下，相邻刻度显示同一标签。Lead 用 4 个约 `4.8e6` 的坐标点复现，X 轴 8 个刻度出现 `4.79e6`、`4.8e6`、`4.81e6` 各重复两次。
- 根因：`formatTick` 对 `|value| >= 1e5` 或 `< 1e-3` 固定使用 `toExponential(2)`，只有 3 位有效数字；密集档步长较小时，相邻刻度被取整到同一文本。
- 修复：新增按 `step` 与 `|value|` 推导有效位数的自适应刻度格式化；每轴统一生成标签并校验唯一性，冲突时逐步提升精度，最终回退到可唯一表示每个有限值的精确文本。`standard` 档在旧标签唯一且可解析时优先沿用原格式，保证既有显示不回归。坐标域、点位、拟合曲线、误差棒像素坐标与后端接口均未改变。
- 新增测试：Lead 复现的 4 点 dense 数据集 X/Y 轴标签唯一；`5e6 ± 5` 与 `1e-6 ± 1e-9` 窄跨度 dense 标签唯一且可解析为有限值；默认 `standard` 常规数据集的 X/Y 固定期望标签数组。
- 修复提交：`4be74e399267a7c4882df82a708f9a5c89a7cf66`
  https://github.com/CubicZnS/labflow/commit/4be74e399267a7c4882df82a708f9a5c89a7cf66
- 修复后 gate：`pnpm typecheck`、`pnpm test:run`（60 passed）、`pnpm build`、`pytest -q`（155 passed）、`ruff check app tests` 全部通过。
- Git：
  - `iter/11` 功能提交：`d18ba2a55970280e1f625ba2348a6ee33829e7d4`
    https://github.com/CubicZnS/labflow/commit/d18ba2a55970280e1f625ba2348a6ee33829e7d4
  - 本轮文档提交与远端 SHA：见完成回报及 `git ls-remote origin refs/heads/iter/11`。
  - 独立 QA：待 Lead 创建并执行（结论待补写）。
  - 合并提交（dev）：待 Lead 在 QA PASS 后合并并补写。
- 已知限制：
  - 样式控制仅作用于当前单系列图表；多系列叠加仍未实现。
  - 网格使用当前自动刻度位置，不提供手动坐标范围、网格颜色、线宽或图例位置编辑。
  - 稀疏/密集档在极小可表示跨度等极端输入下受 IEEE-754 可表示数限制，刻度数可能无法达到目标区间；常规与本题验收的退化输入均满足。
  - 数据量大时仍渲染全部散点；暂无抽稀或分页。PNG/SVG 导出仍未实现。
  - 继承限制：布尔列按 0/1 参与配对；混合对象列会跳过日期行；仅导入第一个 XLSX worksheet；10 MB 文件在大小检查前已被读取；手工表格录入仍未实现；中文 UI 内部分服务端校验消息/警告仍为英文。
- 下一轮：完成 Phase 3.3 多系列叠加；随后 Phase 3.4 实现 PNG/SVG 导出，继续复用现有确定性坐标与样式控件。

### 独立 QA FAIL 闭环（MAC-53）

- QA 结论：MAC-52 独立 QA 判定 FAIL 并阻断合并。功能主体、标签唯一性、字号、网格与 5 个 gate 均通过；唯一阻断项为刻度密度会改变坐标域——`generateDensityTicks` 在域内没有满足数量的整齐步长时选择 `bestExpanded`，把刻度边界扩张成新的 `domain`，该域随后被用于坐标轴、点位、拟合曲线与误差棒，导致切换 sparse/dense 时图形缩放。
- F1 根因：坐标域计算与刻度生成耦合在 `buildAxis` 内；密度分支返回的 `domain` 直接流入 `domainAttributes`、`scaleX/scaleY`、`buildFitCurve` 与误差棒坐标，因此“样式”实际改变了数据几何。
- 修复：`computeDomain` 每轴只执行一次，`buildAxis` 始终返回该固定域；稀疏/密集档只在域内挑选整齐步长，若没有 3–4 / 6–9 个域内刻度则改用域内均匀分数刻度（sparse 4 个、dense 8 个），不再扩张 domain。标准档继续沿用迭代 #10 的域内步长算法，无合适步长时回退为 5 个域内分数刻度。三档密度现在输出完全相同的 X/Y 域、点位、拟合曲线 `points` 与误差棒坐标。
- 复现证据：
  - 6 点小数据 `{x:0..10, y:0.05..0.25}`：三档 X 域均为 `[-0.5, 10.5]`，Y 域均为 `[0.04, 0.26]`；首点/末点 `cy` 三档一致（约 `283.636` / `36.364`）。修复前 sparse 的 Y 域为 `[0, 0.30000000000000004]`。
  - `5e6 ± 5` 数据：三档 X/Y 域均为 `[4999994.5, 5000005.5]`，`cx` 三档一致（约 `100.36` / `587.64`）。修复前 dense 的 X 域为 `[4999994, 5000006]`。
- 新增测试：`ScatterPlot.test.tsx` 增加两组三档一致性回归（6 点数据、`5e6 ± 5`，均含拟合曲线与 Y 误差棒），逐字节比较 `data-domain-*`、每个点 `cx/cy`、拟合曲线 `points`、误差棒坐标；同时断言三档刻度数量、有限性、唯一性与域内约束，dense 在无整齐步长时仍为 6–9 个。前端测试由 60 增至 62。
- 修复提交：`a3285fa6823456c7317852cf532d05acf45060ea`
  https://github.com/CubicZnS/labflow/commit/a3285fa6823456c7317852cf532d05acf45060ea
- 修复后 gate：`pnpm typecheck`、`pnpm test:run`（62 passed）、`pnpm build`、`pytest -q`（155 passed）、`ruff check app tests` 全部通过。
- 最终 HEAD / 合并 SHA：待 Lead 补写。
