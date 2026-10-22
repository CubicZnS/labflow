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
  - 标签修复提交：`4be74e399267a7c4882df82a708f9a5c89a7cf66`
    https://github.com/CubicZnS/labflow/commit/4be74e399267a7c4882df82a708f9a5c89a7cf66
  - 坐标域修复提交：`a3285fa6823456c7317852cf532d05acf45060ea`
    https://github.com/CubicZnS/labflow/commit/a3285fa6823456c7317852cf532d05acf45060ea
  - `iter/11` 最终 HEAD：`43e5f7e64ec4190cca4c7c204d732663d38b519d`
    https://github.com/CubicZnS/labflow/commit/43e5f7e64ec4190cca4c7c204d732663d38b519d
  - 独立 QA：MAC-52 首轮 **FAIL**（F1 刻度密度改变坐标域）；MAC-53 修复后 MAC-54 复核 **PASS**（远端 SHA、范围、F1 闭环、standard 无回归、中文文档与 5 个 gate 全部通过）。
  - `dev` 合并提交：`4545a600fe0793309459e4899c5619cc96223feb`
    https://github.com/CubicZnS/labflow/commit/4545a600fe0793309459e4899c5619cc96223feb
  - 合并后在 `dev` 重跑：后端 `155 passed`、ruff 通过；前端 typecheck 通过、`62 passed`、build 成功。`git ls-remote` 与 `gh api` 对合并 SHA 返回一致；`main` 未改动。
- 已知限制：
  - 样式控制仅作用于当前单系列图表；多系列叠加仍未实现。
  - 网格使用当前自动刻度位置，不提供手动坐标范围、网格颜色、线宽或图例位置编辑。
  - 稀疏/密集档在极小可表示跨度等极端输入下受 IEEE-754 可表示数限制，刻度数可能无法达到目标区间；常规与本题验收的退化输入均满足。
  - 数据量大时仍渲染全部散点；暂无抽稀或分页。PNG/SVG 导出仍未实现。
  - 继承限制：布尔列按 0/1 参与配对；混合对象列会跳过日期行；仅导入第一个 XLSX worksheet；10 MB 文件在大小检查前已被读取；手工表格录入仍未实现；中文 UI 内部分服务端校验消息/警告仍为英文。
- 下一轮：Phase 3.4 多系列叠加与图例；随后 Phase 3.5 实现 PNG/SVG 导出，继续复用现有确定性坐标与样式控件。

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
- 最终 HEAD / 合并 SHA：`iter/11` HEAD `43e5f7e64ec4190cca4c7c204d732663d38b519d`，`dev` 合并提交 `4545a600fe0793309459e4899c5619cc96223feb`（链接见上）。本轮记录提交即 `dev` 分支最新中文提交，未在文件内写入自身 SHA。
- 合并后复核：`dev` 上 5 个 gate 全部通过；`main` 保持 `7b3c2f1` 未改动；无 force push、无历史改写。


## 迭代 #12 — Phase 3.4 多系列叠加与图例

- 日期：2026-10-22
- 目标：在迭代 #11 的单系列 SVG 散点图（自动坐标域、拟合曲线、Y 误差棒、标题/网格/三档刻度密度/三档字号）之上，支持最多 4 个系列叠加（主系列 + 最多 3 个追加系列）与图例；所有系列共享主系列 X 列与 X/Y 单位，主系列保留拟合曲线与 Y 误差棒能力。不新增第三方依赖，不改后端契约。
- 任务选择：MAC-56（Phase 3.4 多系列叠加与图例）。
- 分支：`iter/12`，基于 `dev` 的 `f1cabf0de0c7d607beaec3ec2b845dcb72260186`。
- 已完成：
  - `ScatterPlot` 新增可选 `extraSeries` 属性；主系列保持原 `pairs`/`fit` 契约，单系列行为不变。
  - 共享坐标域：X 域取全部系列有限点的并集；Y 域取全部系列有限点 Y 的并集，并继续覆盖主系列拟合曲线 101 个采样点与误差棒端点；不按系列分别缩放。
  - 每个系列渲染独立 `<g data-testid="scatter-series" data-series-id="...">`；所有点保留 `data-testid="scatter-point"`、`data-x`、`data-y`，并新增 `data-series-id` 与 `data-shape`。
  - 固定调色板与形状：主系列 `#0e7490` + 圆、第二系列 `#6d5bd0` + 方、第三系列 `#be123c` + 三角、第四系列 `#4d7c0f` + 菱形；颜色与形状仅由添加顺序决定，与数据内容无关。
  - 新增 `series-legend` 图例：每个系列一项 `series-legend-item`，含形状标记、颜色、名称与点数；主系列同样有图例项，不只依赖颜色区分。
  - `svg` 增加 `data-series-count`；多系列摘要显示“N 个系列 · M 个数据点”；`aria-label` 包含系列数量与系列名称列表。
  - 多系列 Y 轴标签改为“Y (单位)”或“Y”；X 轴标签仍使用主系列 X 列名与单位。标题、网格、三档刻度密度和三档字号对多系列继续生效，切换样式不改变坐标域或点位。
  - `SeriesPanel` 在成功区块新增“多系列叠加”控制区：只列出未被主系列或已追加系列使用的 Y 列；系列名称默认所选 Y 列名、最长 40 字符、空白回退为 Y 列名；提供中文“添加系列”按钮与“正在添加…”加载态。
  - 追加系列调用现有 `createSeries`，固定传入主系列 `x_column`、`x_unit` 与 `y_unit`；不伪造数据、不改配对算法。
  - 交互限制：总数最多 4 个（主 + 3），达到上限禁用按钮并显示中文提示；重复 Y 列不会出现在下拉框且处理器再次校验；追加失败显示中文错误并保持既有系列与图表不变；每个追加系列可移除并立即更新图表、图例与坐标域；重新生成主系列清空追加系列与旧拟合结果。
  - 追加系列仅提供散点，不提供独立拟合或误差棒；主系列 `fitResult` 语义不变。异步追加响应增加 series 代次保护，避免旧请求回写到重新生成后的主系列。
  - 同步更新中文 README：当前状态、能力、测试数量、版本迭代表、已知限制与下一轮计划。
- 测试：
  - 后端：`.venv/bin/python -m pytest -q` **155 passed**；`.venv/bin/ruff check app tests` 通过；本轮未改后端。
  - 前端：`pnpm typecheck` 通过；`pnpm test:run` **77 passed**；`pnpm build` 成功。
  - 新增覆盖：2/3/4 个系列的分组数量、每系列点数、系列 ID、固定颜色/形状、图例名称与点数；2/3/4 系列共享 X/Y 域的精确固定数据断言；主系列拟合曲线与误差棒仍渲染且 Y 域覆盖采样/端点；追加系列不影响主系列拟合采样；三档刻度密度与三档字号下坐标域、点位、曲线与误差棒不变；单系列无回归；空系列与全空状态；添加系列使用主系列 X 列/单位、重复列过滤、4 系列上限、移除同步、追加失败保持原状、加载态、重新生成清空追加系列与拟合。
- 已知限制：
  - 追加系列只绘制散点，不提供独立拟合曲线或误差棒；拟合仍只属于主系列。
  - 多系列共享主系列 X 列与 X/Y 单位，不支持每个系列独立坐标轴或单位。
  - 图例仅展示系列名称、形状、颜色与点数；暂不支持图例位置、颜色编辑或手动坐标范围。
  - 数据量大时仍渲染全部散点；暂无抽稀或分页。PNG/SVG 导出仍未实现。
  - 继承限制：布尔列按 0/1 参与配对；混合对象列会跳过日期行；仅导入第一个 XLSX worksheet；10 MB 文件在大小检查前已被读取；手工表格录入仍未实现；中文 UI 内部分服务端校验消息/警告仍为英文。
- 下一轮：Phase 3.5 实现 PNG/SVG 导出，继续复用现有确定性坐标、系列样式与拟合/误差渲染。
- Git：
  - `iter/12` 功能提交：`53133235d95071838e9f06339d3c480a879d64ea`
    https://github.com/CubicZnS/labflow/commit/53133235d95071838e9f06339d3c480a879d64ea
  - `iter/12` 中文文档提交：`1ad1b73287fae035f7cd5f7e56b1ea5f4f41510c`
    https://github.com/CubicZnS/labflow/commit/1ad1b73287fae035f7cd5f7e56b1ea5f4f41510c
  - `iter/12` 推送时间校正提交：`f19d499aba253aef5f03627ab1df26e4dd2f2ce4`
    https://github.com/CubicZnS/labflow/commit/f19d499aba253aef5f03627ab1df26e4dd2f2ce4
  - `iter/12` 最终 HEAD：`f19d499aba253aef5f03627ab1df26e4dd2f2ce4`（与 `git ls-remote`、`gh api` 一致）。
  - 独立 QA：MAC-57 **PASS**。QA 逐条核验 13 项验收、远端 SHA、6 个改动文件、5 个 gate、共享坐标域手算、中文 README/版本迭代表/迭代记录；未发现阻断问题。
  - `dev` 合并提交：`227d04a3f7c7318d25b38efd3630ad6b907c93e8`
    https://github.com/CubicZnS/labflow/commit/227d04a3f7c7318d25b38efd3630ad6b907c93e8
  - 合并后在 `dev` 重跑：后端 `pytest -q` 通过（155 个测试，exit 0）、`ruff check app tests` 通过；前端 `typecheck` 通过、`test:run` **77 passed**、`build` 成功。
  - 推送核验：`git ls-remote origin refs/heads/dev` 与 `gh api` 对合并 SHA 返回一致；`main` 保持 `7b3c2f1153eb561241ba33fa74e06953e552e63e` 未改动；无 force push、无历史改写。


## 迭代 #13 — Phase 3.5 PNG/SVG 导出

- 日期：2026-10-22
- 目标：在迭代 #12 的确定性 SVG 散点图（单/多系列、标题、网格、三档刻度密度、三档字号、拟合曲线、Y 误差棒）之上，提供纯前端、确定性、无新增第三方依赖的 SVG 与 PNG 导出；不改后端契约、不重新请求数据、不改变当前坐标域或点位。
- 任务选择：MAC-59（Phase 3.5 PNG/SVG 导出）。
- 分支：`iter/13`，基于 `dev` 的 `eb89325`（迭代 #12 合并与记录）。
- 已完成：
  - 新增 `frontend/src/lib/chartExport.ts`：
    - `SVG_NAMESPACE`、`XLINK_NAMESPACE`、`PNG_EXPORT_SCALE = 2`。
    - `buildChartFileName`：标题优先，空标题回退 `X列-Y列`，统一 `labflow-` 前缀与 `.svg`/`.png` 扩展名；清洗 `/ \ : * ? " < > |`、控制字符、换行/制表符；空白折叠为 `-`；去掉首尾 `.`、`-`、空格；保留中文、字母、数字与下划线；清洗后为空回退 `labflow-chart`；主体最长 80 字符，不截断前缀与扩展名；无时间戳/随机数。
    - `serializeChartSvg`：基于 `cloneNode(true)`，不修改实时 SVG；输出根元素包含 `xmlns`、`xmlns:xlink`，`width`/`height` 取 `viewBox` 宽高（缺省 640×360）并保留 `viewBox`；在克隆体最前插入覆盖整个 viewBox 的不透明白色 `<rect>`；移除全部 `class`；标题、坐标轴、刻度、点、拟合曲线、误差棒与多系列形状原样保留；相同输入输出稳定。
    - `svgToPngBlob`：通过 `<canvas>` 以 2 倍尺寸（640×360 → 1280×720）先填白底再绘制，输出 `image/png`；`createCanvas`/`loadImage`/`createObjectURL`/`revokeObjectURL`/`canvasToBlob` 均可注入；无 2D context 或 `toBlob` 返回 null 时抛出“当前浏览器不支持 PNG 导出”；无论成功、加载失败或缺 context，已创建的 object URL 都会 revoke。
    - `downloadChart`：按格式生成文件名、序列化、生成 Blob 并触发下载，返回实际文件名；下载 DOM 操作可经 `downloadBlob` 注入/隔离。
  - `ScatterPlot` 在 `figcaption` 新增 `导出 SVG` / `导出 PNG` 按钮（`data-testid` 为 `export-svg` / `export-png`，均为 `type="button"`）：
    - 有可绘制点时启用；`pointCount === 0` 时禁用并显示“暂无可导出的数据”。
    - 导出中两个按钮均禁用，对应按钮与 `export-status` 显示“正在导出…”，并用同步 ref 阻止并发重复导出。
    - 成功显示 `export-status`：“已导出 <实际文件名>”。
    - 失败显示中文 `role="alert"` 错误，图表与点位保持不变，可再次导出。
    - 导出传入当前实时 `scatter-plot` SVG、当前列名与标题；不改变标题/网格/刻度/字号状态，不触发新的 series/fit 请求。
- 测试：
  - 后端：`.venv/bin/python -m pytest -q` **155 passed**；`.venv/bin/ruff check app tests` 通过；本轮未改后端。
  - 前端：`pnpm typecheck` 通过；`pnpm test:run` **98 passed**；`pnpm build` 成功。
  - 新增 `chartExport.test.ts` 16 项：文件名标题优先/列回退/非法字符/空白与首尾标点/空值回退/80 字符/稳定性/中文保留；序列化命名空间、显式尺寸、viewBox（含非零原点）、白底为首子元素、去 class、实时 SVG 不变、重复稳定；PNG 2 倍画布、白底、绘制、`image/png`、revoke、缺 context/toBlob null/图片加载失败的中文错误与 revoke；`downloadChart` 两种格式文件名与下载。
  - `ScatterPlot.test.tsx` 新增 5 项导出交互测试：有数据启用、无数据禁用并提示、SVG/PNG 传参正确、成功状态文件名、失败 alert 且图表保留并可重试、导出中禁用与并发点击只调用一次。现有全部回归测试保留通过。
- 已知限制：
  - 导出的 SVG/PNG 不包含 HTML 图例；多系列仍可在图内通过颜色与形状区分。
  - 导出的 SVG 依赖查看器/系统字体，未内嵌字体。
  - 暂不支持自定义导出尺寸、DPI 或透明背景；PNG 固定 2 倍栅格。
  - PNG 依赖浏览器 canvas 能力；不支持时返回中文错误，不生成图片。
  - 继承限制：追加系列无独立拟合/误差棒；多系列共享主系列 X 列与单位；大数据量不抽稀；手工录入、项目持久化、认证与真实计费未实现。
- 下一轮：Phase 4.1 项目保存/重开方向，设计可复现的项目快照（数据引用、列选择、单位、拟合、图表样式与导出设置），本轮不实现。
- Git：
  - `iter/13` 功能与测试提交：`307ef863fcc50b440516831d63f3824822382374`
    https://github.com/CubicZnS/labflow/commit/307ef863fcc50b440516831d63f3824822382374
  - 本文档与 README 提交、最终 HEAD 及合并 SHA 由本轮文档提交、`git ls-remote` 与 Lead 合并后补充；不编造合并 SHA。
- Lead 文档修正提交：`3270773b53a338fc04ee5fb91202f4164a42bcc1`
  https://github.com/CubicZnS/labflow/commit/3270773b53a338fc04ee5fb91202f4164a42bcc1
  （合并 README 两个“当前限制”章节，删除“暂不支持图片导出”过期描述，补充导出限制并校正推送时间；仅改 README。）
- 独立 QA：MAC-60 **PASS**。QA 独立核验远端 4 个提交、6 个改动文件、5 个 gate（后端 155 passed、前端 98 passed）、19 项验收、中文 README/版本迭代表/迭代记录、`main` 未改动；未发现阻断问题。
- `iter/13` 最终 HEAD：`3270773b53a338fc04ee5fb91202f4164a42bcc1`（`git ls-remote origin refs/heads/iter/13` 与 `gh api` 一致）。
- `dev` 合并提交：`f00101b1910c8707e3244aa559aeb0c659b1c8a1`
  https://github.com/CubicZnS/labflow/commit/f00101b1910c8707e3244aa559aeb0c659b1c8a1
- 合并后在 `dev` 重跑 5 个 gate：后端 `pytest -q -o addopts=""` **155 passed**、`ruff check app tests` 通过；前端 `typecheck` 通过、`test:run` **98 passed**、`build` 成功。
- 推送核验：`git ls-remote origin refs/heads/dev` 与 `gh api` 对合并 SHA 返回一致；`main` 保持 `7b3c2f1153eb561241ba33fa74e06953e552e63e` 未改动；无 force push、无历史改写。
- 阶段状态：Phase 3 科学绘图（含 3.1–3.5）完成，验收达成；下一轮进入 Phase 4.1 项目保存/重开与重跑。

## 迭代 #14 — Phase 4.1a 项目快照保存、校验与一键重跑

- 日期：2026-10-22
- 目标：在不引入后端持久化、不新增第三方依赖、不上传或写盘原始数据的前提下，让用户把当前分析配置保存为本地 `.labflow.json` 项目文件；重新导入同一数据集后可打开项目，恢复全部设置并按保存顺序一键重跑主系列、追加系列与拟合。项目文件只保存数据指纹与分析配置。
- 任务选择：MAC-62（迭代 #14，Phase 4.1a 项目快照 v1）。
- 分支：`iter/14`，基于 `dev` 的 `3b3df287dc08e9cfb4ee8162b8f3580a4901defc`（迭代 #13 合并与记录）。
- 已完成：
  - 新增 `frontend/src/lib/projectSnapshot.ts`：
    - 导出 `PROJECT_SCHEMA_VERSION = 1`、`PROJECT_FILE_EXTENSION = ".labflow.json"`、`MAX_PROJECT_FILE_BYTES = 262144`。
    - `ProjectSnapshotV1` 覆盖 `schemaVersion`、`sourceFileName`、`dataset`（format/sizeBytes/sha256/rowCount/numericColumns）、`series`、`extraSeries`、`fit`、`chart`；未运行拟合时 `fit` 为 `null`。
    - `sha256Hex` 使用浏览器 `crypto.subtle.digest("SHA-256")`，返回 64 位小写十六进制；不引入第三方库；Web Crypto 不可用时抛出中文错误。
    - `buildProjectSnapshot` 显式构造对象，固定字段顺序，无时间戳/随机数；`sizeBytes` 取实际字节长度，`sha256` 由同一字节计算；空白追加系列名称回退为列名并截断到 40 字符。
    - `serializeProjectSnapshot` 输出固定字段顺序、2 空格缩进、末尾换行；`parseProjectSnapshot` 严格校验并显式拷贝字段，拒绝未知顶层字段；所有错误均为中文 `ProjectSnapshotError`。
    - 校验覆盖：空文件/非法 JSON/非对象、schemaVersion、字段类型、format/degree/tickDensity/fontScale 枚举、SHA-256 格式、非负整数字节数与行数、数值列非空/无重复/无空串、X≠Y 且属于数值列、追加系列最多 3 个且不与主系列或彼此重复、名称 ≤ 40、单位 ≤ 32、标题 ≤ 120、拟合误差列冲突、`__proto__` 等原型键不污染返回对象。
    - `buildProjectFileName` 去掉 `.csv`/`.xlsx` 后缀，统一 `labflow-` 前缀与 `.labflow.json` 扩展名；清洗 `/ \ : * ? " < > |`、控制字符、换行/制表符，空白折叠为 `-`，保留中文，空主体回退 `labflow-project`，主体最长 80 字符。
    - `datasetMatchesSnapshot` 以 SHA-256 为准，同时严格比较 format、sizeBytes、rowCount、numericColumns（含顺序）；`readProjectFile` 超过 256 KB 或读取/解析/校验失败均抛出中文错误；`downloadProjectSnapshot` 触发浏览器下载并返回真实文件名。
  - `SeriesPanel` 新增“项目”区块（配对成功后显示）：
    - `保存项目`（`data-testid="save-project"`，`type="button"`）：用当前 `File` 计算 SHA-256，构造并序列化快照，触发下载；成功显示 `project-status`“已保存 <文件名>”，失败显示中文 `role="alert"`，不清空现有分析。
    - `打开项目` 文件选择（`data-testid="open-project"`，`accept=".json,.labflow.json,application/json"`）：读取/校验期间显示“正在读取项目…”并禁用；非法文件、超限、版本不支持或数据集不匹配均显示中文错误，且不改变当前分析状态、不发起配对/拟合请求。
    - 数据集匹配后恢复 X/Y 列、单位、图表标题、网格、刻度密度、字号、按保存顺序的追加系列、拟合次数/误差列/单位与“是否曾运行”，随后自动重跑：主系列 1 次 → 每个追加系列 1 次（按顺序）→ 拟合至多 1 次。
    - 重跑中显示“正在重跑：主系列配对… / 追加系列「…」/ 拟合…”并禁用保存、打开、生成配对、添加系列与运行拟合；使用 `seriesRunRef` 代次标记隔离旧请求，`projectOpenRef` 防止重复打开。
    - 任一步失败立即停止后续步骤，保留已成功的主系列/追加系列或拟合结果，显示包含失败步骤的中文 `role="alert"` 错误；打开按钮恢复可用，可再次打开项目重试。
    - 手动“生成配对数据”仍会清空追加系列、拟合设置与拟合结果，行为保持不变。
  - `FitPanel` 改为受控展示组件：`degree`、`errorColumn`、`errorUnit`、`fitState` 上提到 `SeriesPanel`，保留 `fit-degree-select`、`fit-error-select`、`fit-error-unit-input`、`fit-error`、拟合结果展示与“运行拟合”按钮；拟合结果仍传给 `ScatterPlot`。
  - 同步更新中文 `README.md`：当前状态、能力、尚未完成、下一轮、测试数量、已知限制与“版本迭代记录”表（迭代 #14，推送时间 2026-10-22 05:06，新增内容完整）。
  - 独立 QA（MAC-63）复核后判 **FAIL**：主系列重跑失败时 `seriesState` 进入 `error`，项目区块渲染条件只覆盖 `success`、`projectOpening`、`projectRerunning`，而 `handleOpenProject` 的 `finally` 又会复位后两者，导致 `project-section`、`project-error` 与 `open-project` 被整体卸载，用户看不到失败步骤的中文错误，也无法直接重试打开项目。其余 A/B/D 项均 PASS。
  - **QA FAIL 闭环（MAC-64，迭代 #14 补丁）**：
    - 问题：主系列重跑失败后项目入口、中文错误与重试入口不可见；仅追加系列/拟合失败时因主系列已成功而恰好保持可见。
    - 修复：将 `projectError !== null` 纳入项目区块渲染条件。失败后项目区块保持可见，`project-error`（中文 `role="alert"`）展示失败步骤，`open-project` 恢复可用；打开失败（非法文件/数据集不匹配）仍不改分析状态并保留原有中文错误。
    - 语义保持：主系列失败时保留错误状态；追加系列/拟合失败时保留已完成的主系列与追加系列；失败后不再发起后续追加系列或拟合请求；冲突锁定、代次隔离、防重复打开与失败重试逻辑均未改动。
    - 测试：`SeriesPanel.test.tsx` 新增“主系列重跑失败后项目区块与重试入口保持可见”，断言 `project-section`、`project-error`（`role="alert"`、含“主系列”与中文失败信息）、`open-project` 可见且可用、后续 `createSeries` 次数不增加、`createFit` 未调用，并验证再次打开同一项目可重跑成功。
    - 文档：README“版本迭代记录”迭代 #14 修复内容改为真实摘要，前端测试数更新为 134；本记录补充 QA FAIL 闭环。
- 测试：
  - 后端：`.venv/bin/python -m pytest -q -o addopts=""` **155 passed**；`.venv/bin/ruff check app tests` 通过；本轮未改后端。
  - 前端：`pnpm typecheck` 通过；`pnpm test:run` **134 passed**；`pnpm build` 成功。
  - 新增 `projectSnapshot.test.ts` 28 项：常量；空字节与 `abc` 的 SHA-256 已知向量、64 位小写格式、TypedArray 视图、Web Crypto 缺失中文错误；快照字段完整/固定顺序/无时间戳、fit=null、空白名称回退；确定性序列化与嵌套键顺序、不含原始行/配对点/系数/残差/警告/凭据；往返解析；版本、类型、枚举、SHA 格式、负数/小数、重复/空列、X=Y、列不在数值列、追加系列上限/冲突/名称长度、单位/标题长度、拟合次数与误差列冲突、未知顶层字段与 `__proto__`；数据集匹配成功与 hash/size/format/row/列顺序不一致；文件名后缀/非法字符/中文/空回退/80 字符/稳定性；`readProjectFile` 有效、超限、非法 JSON；`downloadProjectSnapshot` 文件名、下载动作、Blob 内容与确定性文本。
  - 新增 `SeriesPanel.test.tsx` 8 项：保存快照字段完整且不含原始数据/配对点/系数/警告，成功状态；保存失败中文 alert 且分析保留；非法文件不改状态；数据集不匹配不改状态且不请求；恢复全部设置并按主系列→温度→压力→拟合顺序各请求一次；追加系列中途失败保留主系列与已完成系列、不请求拟合、可重试；主系列重跑失败后项目区块、中文 `role="alert"`、失败步骤与重试入口保持可见且不继续追加系列/拟合，再次打开可恢复成功；重跑中锁定保存/打开/生成配对/添加系列/运行拟合并忽略重复打开，完成后恢复。
  - 现有 `App.test.tsx` 45 项、`ScatterPlot.test.tsx` 37 项、`chartExport.test.ts` 16 项全部保持通过，未削弱既有 data-testid 与交互断言。
- 已知限制：
  - 不做后端持久化、SQLite、账户、云同步或跨设备共享；项目文件完全在浏览器本地处理，不上传后端。
  - 项目文件只保存数据指纹与分析配置，不保存原始数据行、配对点、拟合系数/残差或警告详情；打开前必须重新导入保存时同一份数据文件，SHA-256、格式、字节数、行数或数值列任一不一致即拒绝。
  - 项目文件上限 256 KB，仅支持 schema v1；SHA-256 依赖浏览器 Web Crypto，不支持时显示中文错误。
  - 不保存导出尺寸/DPI、图例布局、手动坐标范围或颜色编辑；不新增 npm/pip 依赖，不改变既有统计、配对、拟合、绘图、导出算法与后端契约。
  - 打开项目要求当前数据集已成功生成过配对结果才能首次进入项目区域；主系列重跑失败后项目区块、失败步骤中文错误与重试入口保持可见。追加系列恢复后仍共享主系列 X 列与 X/Y 单位，不恢复独立拟合或误差棒。
  - 继承限制：多系列共享主系列 X 列与单位；追加系列只绘制散点；大数据量不抽稀；手工表格录入、认证与真实计费未实现。
- 下一轮：Phase 4.1b，在本地项目快照 v1 之上评估导出设置与项目元数据保存、版本兼容/迁移策略，继续不引入后端持久化与数据上传。
- Git：
  - `iter/14` 功能、测试与 README 提交：`6e56cadbf75343f84fc18dc94d76b75cb1a01c9c`
    https://github.com/CubicZnS/labflow/commit/6e56cadbf75343f84fc18dc94d76b75cb1a01c9c
  - `iter/14` QA FAIL 闭环修复、测试与 README 提交：`54f67c7daf7ae61c006e7e9db63610b32bd2b31b`
    https://github.com/CubicZnS/labflow/commit/54f67c7daf7ae61c006e7e9db63610b32bd2b31b
  - `iter/14` 迭代记录提交：`ca1468be1f26dcd717cd155574c0e1b669683018`
    https://github.com/CubicZnS/labflow/commit/ca1468be1f26dcd717cd155574c0e1b669683018
  - `iter/14` 最终 HEAD：`ca1468be1f26dcd717cd155574c0e1b669683018`（`git ls-remote origin refs/heads/iter/14` 与 `gh api` 一致）。
  - 独立 QA（第二轮）：MAC-65 **PASS**。QA 独立核验远端 SHA、5 个 gate、主系列重跑失败后的项目区块/中文错误/重试入口与再次打开恢复、追加系列/拟合失败保留、非法文件与数据集不匹配、冲突锁定与代次隔离、快照隐私；并用“还原修复前 `SeriesPanel.tsx` 后新增用例必失败”的方式验证测试有效性；中文 README/版本迭代表/迭代日志均合格。
  - `dev` 合并提交：`d56f2a2a8b8db00ae183087e0ac56cca10999cb9`
    https://github.com/CubicZnS/labflow/commit/d56f2a2a8b8db00ae183087e0ac56cca10999cb9
  - 合并后在 `dev` 重跑 5 个 gate：后端 `pytest -q -o addopts=""` **155 passed**、`ruff check app tests` 通过；前端 `typecheck` 通过、`test:run` **134 passed**、`build` 成功。
  - 推送核验：`git ls-remote origin refs/heads/dev` 与 `gh api` 对合并 SHA `d56f2a2a8b8db00ae183087e0ac56cca10999cb9` 返回一致；`main` 保持 `7b3c2f1153eb561241ba33fa74e06953e552e63e` 未改动；无 force push、无历史改写。
  - 阶段状态：Phase 4.1a（本地项目快照 v1）完成并合并；下一轮进入 Phase 4.1b（导出设置/项目元数据保存与版本兼容/迁移），继续不引入后端持久化与数据上传。

## 迭代 #15 — Phase 4.1b 项目元数据与 PNG 导出倍率（schema v2）

- 日期：2026-10-22
- 目标：在迭代 #14 的本地项目快照 v1 之上，新增项目名称/备注与 PNG 导出倍率（1×/2×/3×）持久化，把快照升级为 schema v2，并保证 v1 项目文件可打开、严格校验后迁移为 v2；不新增后端功能、不新增依赖、不上传数据。
- 任务选择：MAC-67（迭代 #15，Phase 4.1b）。
- 分支：`iter/15`，基于 `dev` 的 `61287f6e9c1e4f4d802cea33436c8950fce46e92`。只在该分支提交并 push，不合并、不 force push、不改写历史。
- 产品决策：
  - 项目元数据只保存 `name`（≤80 字符）与 `note`（≤500 字符），保存前 trim，允许为空。
  - 导出设置只持久化 PNG 栅格倍率 `pngScale`（1/2/3，默认 2）；导出格式（SVG/PNG）仍按次选择，不持久化；不实现 DPI、自定义尺寸或透明背景。
  - 项目文件名继续由数据源文件名生成，不使用项目名称。
- 已完成：
  - `frontend/src/lib/projectSnapshot.ts`：
    - `PROJECT_SCHEMA_VERSION = 2`，新增 `LEGACY_PROJECT_SCHEMA_VERSION = 1`、`MAX_PROJECT_NAME_LENGTH = 80`、`MAX_PROJECT_NOTE_LENGTH = 500`、`DEFAULT_PNG_SCALE = 2` 与 `PngScale = 1 | 2 | 3`。
    - 新增 `ProjectMetadata`、`ProjectExport`、`ProjectSnapshotV2` 与 `ProjectSnapshot` 别名；保留 `ProjectSnapshotV1` 作为历史类型。
    - `buildProjectSnapshot` 接收 `metadata` 与 `export`，名称/备注 trim 后按上限截断，非法 `pngScale` 归一为 2；输出确定性、无时间戳/随机数。
    - 顶层字段顺序固定为 `schemaVersion, sourceFileName, metadata, dataset, series, extraSeries, fit, chart, export`；`serializeProjectSnapshot` 始终写出 schema v2、2 空格缩进、末尾换行。
    - `parseProjectSnapshot` 对 v2 严格校验 `metadata`/`export` 类型、长度上限与 `pngScale` 仅 1/2/3；对 v1 严格校验原有字段后补齐 `metadata = { name: "", note: "" }`、`export = { pngScale: 2 }` 并迁移为 v2；其他版本返回中文“版本不支持”。
    - 新增嵌套对象未知字段校验（dataset/series/extraSeries/fit/chart/metadata/export），继续拒绝未知顶层字段与 `__proto__` 等原型污染键；全部错误为中文 `ProjectSnapshotError`。
    - 项目文件仍不包含原始数据行、配对点、系数、残差、警告或凭据；`readProjectFile`、`downloadProjectSnapshot`、`datasetMatchesSnapshot` 均改用 v2 类型。
  - `frontend/src/lib/chartExport.ts`：
    - 保留 `PNG_EXPORT_SCALE = 2` 作为默认值；新增 `PngExportScale` 与 `normalizePngScale`。
    - `svgToPngBlob` 新增可选 `pngScale` 参数，`downloadChart` 选项新增可选 `pngScale`；输出画布为 viewBox 宽高 × 倍率，非法值回退 2；白底、revoke、错误信息、文件名逻辑与 SVG 路径保持不变。
  - `frontend/src/components/ScatterPlot.tsx`：
    - 新增可选 `pngScale?: 1 | 2 | 3`（默认 2）并传给 `downloadChart`；PNG 按钮文案显示当前倍率（如“导出 PNG（3×）”）；`data-testid="export-png"`、SVG 按钮、导出状态与错误行为保持不变。
  - `frontend/src/components/SeriesPanel.tsx`：
    - 项目区块新增项目名称输入（`project-name-input`，maxLength 80）、项目备注 textarea（`project-note-input`，maxLength 500）与 PNG 倍率 select（`png-scale-select`，1×/2×/3×），均在 `projectBusy` 时禁用。
    - 保存项目时写入 `metadata`/`export`；打开项目时恢复三者并把 `pngScale` 传给 `ScatterPlot`；一键重跑顺序、失败可见性/重试、代次隔离与锁定逻辑保持不变，不新增 series/fit 请求。
    - 手动“生成配对数据”仍清空追加系列与拟合结果，但保留项目名称/备注/PNG 倍率（已在测试中固定）。
  - 文档：更新中文 `README.md` 当前状态、能力、测试命令/数量、已知限制、下一轮与“版本迭代记录”表（迭代 #15）；本记录为中文。
- 测试：
  - 后端：`.venv/bin/python -m pytest -q -o addopts=""` **155 passed**；`.venv/bin/ruff check app tests` 通过；本轮未改后端。
  - 前端：`pnpm typecheck` 通过；`pnpm test:run` **147 passed**；`pnpm build` 成功。
  - 新增/更新覆盖：schema v2 常量与固定字段顺序、确定性序列化；名称/备注 trim 与 build 截断；非法 pngScale 归一；v2 往返；v1 迁移默认值与保存写 v2；v1 严格校验与未知字段拒绝；metadata/export 类型/长度/枚举/未知字段；新增嵌套未知字段校验；PNG 1×/2×/3× 画布尺寸、默认 2 与非法值回退；ScatterPlot 倍率按钮文案与传参；SeriesPanel 保存/恢复名称/备注/倍率、旧字段清空、重新生成保留输入、重跑期间控件禁用、v1 项目打开迁移。
- 已知限制：
  - 仍不做后端持久化、账户、云同步或跨设备共享；项目文件完全在浏览器本地处理。
  - 项目文件仅保存指纹、元数据、导出倍率与分析配置；打开前仍须重新导入同一份数据文件。
  - PNG 仅 1×/2×/3×，默认 2×；不提供自定义尺寸、DPI 或透明背景；导出格式不持久化。
  - 项目名称最长 80、备注最长 500，保存前 trim 并截断；项目文件名不使用项目名称。
  - 仅支持读取 schema v1/v2；其他版本显示中文“版本不支持”。
- 下一轮：Phase 4.2 示例数据与新手引导——一键载入内置示例 CSV、首页文案与当前 Phase 4 能力对齐、首次使用步骤提示；继续保持数据不上传、不引入后端持久化，并补足验收所需的可复现说明。
- Git：
  - `iter/15` 功能、测试与 README 提交：`c0f9e910437040b2bf5769733d86de8feda9b454`
    https://github.com/CubicZnS/labflow/commit/c0f9e910437040b2bf5769733d86de8feda9b454
  - `iter/15` 文档/迭代记录提交：`1a8631f233bb09d287e9989f297ef65a9139f0f0`
    https://github.com/CubicZnS/labflow/commit/1a8631f233bb09d287e9989f297ef65a9139f0f0
  - `iter/15` 补入文档提交 SHA 的提交：`badc630e653e98c29ec1cb952427f1a734d3fac5`
    https://github.com/CubicZnS/labflow/commit/badc630e653e98c29ec1cb952427f1a734d3fac5
  - `iter/15` 最终 HEAD：`badc630e653e98c29ec1cb952427f1a734d3fac5`（`git ls-remote origin refs/heads/iter/15` 与 `gh api` 一致）。
  - 独立 QA：MAC-68 **PASS**。QA 独立核验 A1–A3、B4–B9、C、D10–D13、E14–E18 共 18 项：远端 3 个提交与 `dev`/`main` 基线、10 个允许文件、v2 固定字段顺序与确定性、v1 严格迁移默认值、metadata 长度/trim、pngScale 1/2/3 与默认/非法回退、保存恢复、5 项 gate、中文 README/版本迭代表/迭代记录、项目文件隐私与主系列失败回归。无阻断问题；两条非阻断观察：`serializeProjectSnapshot` 依赖 TypeScript 类型约束、迭代记录当时未单列补 SHA 提交（本记录已补入）。
  - `dev` 合并提交：`aeed1843950c2d43971cc14224282b6802c05872`
    https://github.com/CubicZnS/labflow/commit/aeed1843950c2d43971cc14224282b6802c05872
  - 合并后在 `dev` 重跑 5 个 gate：后端 `pytest -q -o addopts=""` **155 passed**、`ruff check app tests` 通过；前端 `typecheck` 通过、`test:run` **147 passed**、`build` 成功。
  - 推送核验：`git ls-remote origin refs/heads/dev` 与 `gh api` 对合并 SHA `aeed1843950c2d43971cc14224282b6802c05872` 返回一致；`main` 保持 `7b3c2f1153eb561241ba33fa74e06953e552e63e` 未改动；无 force push、无历史改写。
  - 阶段状态：Phase 4.1b（项目元数据、PNG 导出倍率与快照 schema v2）完成并合并；Phase 4 MVP 产品化仍在进行，下一轮进入 Phase 4.2 示例数据与新手引导。

## 迭代 #16 — Phase 4.2 示例数据与新手引导

- 日期：2026-10-22
- 目标：提供一键载入内置示例 CSV、把首页当前阶段与真实能力对齐到 Phase 4，并加入中文首次使用三步引导；纯前端增量，不新增依赖、不改后端契约、不上传用户数据、不引入后端持久化。
- 任务选择：MAC-70（迭代 #16，Phase 4.2）。
- 分支：`iter/16`，基于 `dev` 的 `7279e8b0e2df6c404cf1175c52e6c9599b150df1`。只在该分支提交并 push，不合并、不 force push、不改写历史。
- 产品决策：
  - 示例数据只有一个：仓库现有 `frontend/public/samples/labflow-demo.csv`（12 行，含 `sample_id/time_s/absorbance/temperature_c/notes`、1 个缺失读数与中文备注），不新增或改写示例文件。
  - 一键载入必须复用现有导入链路：`GET /samples/labflow-demo.csv` → 构造同名 `File` → `uploadDataset` → 现有成功视图；成功后不自动发起 series 或 fit 请求。
  - 示例载入失败不破坏当前已选文件、已解析结果或分析状态，错误用中文 `role="alert"` 单独展示，可重试或手动上传。
  - 首页不再宣称 Phase 3 当前阶段或未实现的手工录入，首次使用引导只描述已落地能力。
- 已完成：
  - `frontend/src/components/CsvImportPanel.tsx`：
    - “1. 选择文件”卡片新增 `载入示例数据` 按钮（`type="button"`、`data-testid="load-sample"`）；载入中显示“正在载入示例…”并禁用按钮、上传、清除和文件选择。
    - 新增同步 `sampleLoadingRef`，双击只触发一次 GET 与一次 POST；`handleLoadSample` 先 `fetch("/samples/labflow-demo.csv")`，非 2xx 抛中文错误，成功后读取响应文本并构造 `new File([text], "labflow-demo.csv", { type: "text/csv" })`。
    - 抽取 `runUpload(file)` 供手动上传与示例载入共用，保持成功视图、错误视图、`uploadId` 递增与 `SeriesPanel` 重置行为一致。
    - 示例 GET 失败时展示 `data-testid="sample-error"` 的中文 `role="alert"`，不清空 `selectedFile`、已解析结果或分析状态；再次点击可重试，手动上传仍可用。保留下载链接与全部既有 `data-testid`。
  - `frontend/src/App.tsx`：
    - Hero 徽标、路线图标题与 Footer 当前阶段改为 `Phase 4 · MVP 产品化`；路线图正文改为导入/校验/统计/拟合/多系列绘图/PNG-SVG 导出/本地项目快照，并说明剩余 Phase 4 工作（示例与引导、错误处理与可访问性、隐私复核）。
    - Workflow 01 去掉未实现的“手动录入”，改为 CSV/XLSX 导入或一键载入示例数据。
    - 新增 `data-testid="onboarding-guide"` 的首次使用三步引导：检查导入结果 → 选择 X/Y 与单位并生成配对（可追加系列与 Y 误差列）→ 拟合、调整样式并导出 SVG/PNG 或保存 `.labflow.json` 项目文件。
    - API 状态徽标、锚点导航和响应式布局保持不变。
  - `frontend/src/App.test.tsx`：
    - 新增示例载入成功测试：先 GET 示例文件再 POST CSV，FormData 文件名为 `labflow-demo.csv`、类型 `text/csv`，显示解析结果并可继续配对，不产生 series/fit 请求。
    - 新增示例 GET 404 测试：中文 `sample-error` 可见、不发 POST、此前解析结果与已选文件保持不变、手动上传可用，再次点击可重试成功。
    - 新增载入中状态与双击测试：按钮显示“正在载入示例…”且禁用，上传/文件选择禁用，完成后仅 1 次 GET 与 1 次 POST。
    - 新增 Phase 4 首页测试：路线图标题为 `Phase 4 · MVP 产品化`，不再出现 `Phase 3 · 科学绘图` 或“手动录入”，并核验三步引导文案。
  - 文档：更新中文 `README.md` 当前状态、能力、测试命令/数量、已知限制、下一轮与“版本迭代记录”表（迭代 #16）；本记录为中文。
- 测试：
  - 后端：`.venv/bin/python -m pytest -q -o addopts=""` **155 passed**；`.venv/bin/ruff check app tests` 通过；本轮未改后端。
  - 前端：`pnpm typecheck` 通过；`pnpm test:run` **151 passed**；`pnpm build` 成功。
  - 新增/更新覆盖：示例 GET → 同名 File → CSV POST 顺序与文件名/类型；成功视图与配对入口；无自动 series/fit 请求；GET 失败的中文 alert、无 POST、数据保留、重试成功；载入中禁用与双击防重；Phase 4 文案、移除过期 Phase 3 当前阶段与手工录入、首次使用三步引导。
- 已知限制：
  - 一键载入依赖前端静态资源 `/samples/labflow-demo.csv`；资源不可用或网络失败时需重试或手动上传。
  - 示例载入成功后仅完成导入与解析，仍需用户手动选择 X/Y 与单位并生成配对。
  - 仍不做后端持久化、账户、云同步或跨设备共享；示例文件不包含用户数据。
  - 首页只更新文案与引导，不新增手工录入、图例自定义或云端能力。
- 下一轮：Phase 4.3 错误处理与可访问性、隐私复核；继续保证数据不上传、确定性计算、中文优先与项目重跑结果一致。
- Git：
  - `iter/16` 功能、测试与页面提交：`22b1774a63fb25fb12bddce2a7d390946c2ffbfc`
    https://github.com/CubicZnS/labflow/commit/22b1774a63fb25fb12bddce2a7d390946c2ffbfc
  - `iter/16` 文档/迭代记录提交：`a755e43f4125273306dec24b4dc8388721c74df8`
    https://github.com/CubicZnS/labflow/commit/a755e43f4125273306dec24b4dc8388721c74df8
  - `iter/16` 最终 HEAD：`f2990d85cc784960adc1c74335e1cee8dea85077`
    https://github.com/CubicZnS/labflow/commit/f2990d85cc784960adc1c74335e1cee8dea85077
    （`git ls-remote origin refs/heads/iter/16` 与 `gh api` 一致）。
  - 独立 QA：MAC-71 **PASS**。QA 独立核验 A1–A4、B5–B9、5 项 gate、D10–D13、E14–E18，并确认构建产物包含示例 CSV、工作区恢复干净；无阻断问题。4 项非阻断观察：`App.tsx` 剩余工作文案仍列“示例与引导”（本轮已完成）、迭代记录最终 HEAD 为泛称（本提交已补实）、双击测试未通过移除 ref 验证测试有效性、失败测试未逐项断言统计/配对面板。均不影响本轮验收。
  - `dev` 合并提交：`aa5268e81cc7b4b9a4802ac81f0fa30dcec27c7f`
    https://github.com/CubicZnS/labflow/commit/aa5268e81cc7b4b9a4802ac81f0fa30dcec27c7f
  - 合并后在 `dev` 重跑 5 个 gate：后端 `pytest -q -o addopts=""` **155 passed**、`ruff check app tests` 通过；前端 `typecheck` 通过、`test:run` **151 passed**、`build` 成功。
  - 推送核验：`git ls-remote origin refs/heads/dev` 与 `gh api` 对合并 SHA `aa5268e81cc7b4b9a4802ac81f0fa30dcec27c7f` 返回一致；`main` 保持 `7b3c2f1153eb561241ba33fa74e06953e552e63e` 未改动；无 force push、无历史改写。
  - 阶段状态：Phase 4.2（示例数据与新手引导）完成并合并；Phase 4 MVP 产品化仍在进行，下一轮进入 Phase 4.3 错误处理与可访问性、隐私复核。

## 迭代 #17 — Phase 4.3a 可访问性与状态播报

- 日期：2026-10-22（README 推送时间按实际推送记为 2026-10-22 08:04 Asia/Shanghai）
- 目标：补齐键盘与屏幕阅读器可访问性基础，并让异步解析状态可被辅助技术感知；纯前端增量，不新增依赖、不改后端契约、不上传用户数据、不做后端持久化。
- 任务选择：MAC-73（迭代 #17，Phase 4.3a）。
- 分支：`iter/17`，基于 `dev` 的 `884e7c2d1291bbe22b67e84029cfe3b93a9e4e9b`。只在该分支提交并 push，不合并、不 force push、不改写历史。
- 产品决策：
  - 不引入 axe、eslint-plugin-jsx-a11y 或其他新依赖，使用现有 Testing Library 断言可访问名称/角色/焦点/状态。
  - 不改变现有视觉风格和业务行为：分析计算、绘图、导出、项目快照逻辑保持不变。
  - 所有新增文案使用中文；错误播报继续由既有 `role="alert"` 承担。
- 已完成：
  - `frontend/src/App.tsx`：
    - 页面最顶部（`min-h-screen` 内、`header` 之前）新增首个可聚焦元素：中文链接“跳到主要内容”，`href="#import"`，`className="skip-link"`。
    - 保留 `main id="top"`、导航锚点、响应式布局与全部既有文案。
  - `frontend/src/index.css`：
    - 新增 `.skip-link`：默认移出视口并视觉隐藏，获得焦点时固定于左上角、白底深色文字、高对比边框/阴影、`z-index: 50` 高于 sticky header，可继续 Tab 离开。
    - 新增全局 `:focus-visible` 描边（`3px solid #0e7490`、`outline-offset: 2px`），覆盖链接、按钮、输入框、下拉框、文本域与带 `tabindex` 的元素；未全局移除 outline，也未删除组件既有 `focus:ring`。
    - 新增 `@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }`。
    - 未修改 Tailwind 主题或 `tailwind.config`。
  - `frontend/src/components/CsvImportPanel.tsx`：
    - 导入区块增加 `tabIndex={-1}`、`aria-labelledby="import-title"`，标题增加 `id="import-title"`。
    - 右侧结果卡片移除整卡 `aria-live`，改为 `aria-busy={uploadState.status === "parsing" || isSampleLoading}`，避免每次结果变化整块播报。
    - 左侧上传卡片新增屏幕阅读器专用 `role="status" aria-live="polite"` 状态行（`data-testid="parse-status"`）：仅在解析成功时播报“解析完成：<文件名>，共 <N> 行，<M> 个数值列。”；空闲、解析中与失败时为空。
    - 保留解析中 `role="status"` 提示、`role="alert"` 错误、示例载入复用同一状态机与全部既有 `data-testid`。
  - `frontend/src/components/SeriesPanel.tsx`：
    - “打开项目”由 `<label>` 改为真实 `<button type="button">`（`data-testid="open-project-button"`），通过 `useRef` 触发隐藏 file input 的 `.click()`；`disabled={!canOpenProject}` 并保留禁用态样式。
    - 隐藏 input 继续使用 `className="sr-only"`、原 `accept`、`disabled`、`data-testid="open-project"` 与 `onChange`，不使用 `display:none`；删除旧 label，避免重复可访问名称。
    - 项目区块 `data-testid="project-section"` 增加 `aria-busy={projectBusy}`。
    - 追加系列“移除”按钮增加 `disabled={extraLoading || projectBusy}` 与禁用样式，保留中文 `aria-label` 和既有 testid。
    - 保存/打开/重跑顺序、代次隔离、错误文案与既有 `data-testid` 语义保持不变。
  - 测试：
    - `frontend/src/App.test.tsx` 新增：跳转链接为页面首个可聚焦元素且 `#import` 可聚焦并关联标题；解析成功状态行包含文件名/行数/数值列数，解析中结果卡 `aria-busy="true"`、完成后为 `"false"`；上传失败不通过状态行播报。
    - `frontend/src/components/SeriesPanel.test.tsx` 新增：`open-project-button` 为真实按钮、可聚焦且点击触发隐藏 file input；项目重跑忙时按钮禁用、完成后恢复；追加系列加载中“移除”按钮禁用、完成后恢复。既有打开/重跑、项目快照与统计/绘图测试保持通过。
  - 文档：更新中文 `README.md` 当前状态、当前能力、测试命令/数量、已知限制、下一轮与“版本迭代记录”表（迭代 #17）；本记录为中文。
- 测试：
  - 后端：`.venv/bin/python -m pytest -q -o addopts=""` **155 passed**；`.venv/bin/ruff check app tests` 通过；本轮未改后端。
  - 前端：`pnpm typecheck` 通过；`pnpm test:run` **156 passed**；`pnpm build` 成功。
  - 新增覆盖：skip-link 首个焦点与目标区块 `tabindex=-1`；解析状态中文播报与 `aria-busy` 切换；错误不进入状态行；项目打开按钮角色/焦点/点击转发/忙时禁用；追加系列忙时移除禁用。
- 已知限制：
  - 只覆盖基础键盘、焦点可见性与状态播报；未引入 axe 等自动化审计，也未做完整 WCAG 认证或屏幕阅读器人工实测。
  - 结果卡在示例载入期间标记 `aria-busy`，但示例载入进度仍由按钮文案与既有状态提示表达。
  - 仍不做后端持久化、账户、云同步或跨设备共享；本轮不改变任何分析、绘图、导出或项目快照计算行为。
- 下一轮：Phase 4.3b 隐私复核与剩余错误处理；复核示例载入、项目快照和导出路径的隐私边界，统一面向用户的错误文案，并补足可访问性回归。
- Git：
  - `iter/17` 功能、测试与样式提交：`9f5ff1f82a054f05045315c2d0ba5a80662b0d91`
    https://github.com/CubicZnS/labflow/commit/9f5ff1f82a054f05045315c2d0ba5a80662b0d91
  - `iter/17` 文档/迭代记录提交：`d2188a9f3e96b8c6cc84ed9a9f2561061470773e`
    https://github.com/CubicZnS/labflow/commit/d2188a9f3e96b8c6cc84ed9a9f2561061470773e
  - `iter/17` 补记文档提交 SHA：`f38140652609f324b2cc517e5c1d4c915927850c`
    https://github.com/CubicZnS/labflow/commit/f38140652609f324b2cc517e5c1d4c915927850c
  - `iter/17` 时间校正提交（最终 HEAD）：`5c3182338d5217c6887eb61d0382fd7509c16d5c`
    https://github.com/CubicZnS/labflow/commit/5c3182338d5217c6887eb61d0382fd7509c16d5c
    （`git ls-remote origin refs/heads/iter/17` 与 `gh api` 对最终 HEAD 返回一致）。
  - 独立 QA：MAC-74 **PASS**。QA 独立核验 A1–A3、B4–B9、C10–C14、D15–D18 共 18 项：远端 4 个提交与基线、8 个允许文件、无依赖/后端改动、skip-link 首个焦点与 `#import` 关联、全局焦点样式与减少动态偏好、解析状态播报与 `aria-busy`、键盘可达的项目打开按钮、忙时移除禁用、5 项 gate、中文 README/版本迭代表/迭代记录，以及 4 项实现变异抽查（删除实现后对应新测试失败）。无阻断问题；3 项非阻断观察：既有测试一行两语句格式、未做 axe/WCAG/人工读屏、补记提交未逐一列出链接（本记录已补入）。
  - `dev` 合并提交：`b4a33797b480af81212522d13542770dc36ff4c9`
    https://github.com/CubicZnS/labflow/commit/b4a33797b480af81212522d13542770dc36ff4c9
  - 合并后在 `dev` 重跑 5 个 gate：后端 `pytest -q -o addopts=""` **155 passed**、`ruff check app tests` 通过；前端 `typecheck` 通过、`test:run` **156 passed**、`build` 成功。
  - 推送核验：`git ls-remote origin refs/heads/dev` 与 `gh api` 对合并 SHA `b4a33797b480af81212522d13542770dc36ff4c9` 返回一致；`main` 保持 `7b3c2f1153eb561241ba33fa74e06953e552e63e` 未改动；无 force push、无历史改写。
  - 阶段状态：Phase 4.3a（可访问性基础与状态播报）完成并合并；Phase 4 MVP 产品化仍在进行，下一轮进入 Phase 4.3b 隐私复核与剩余错误处理。

## 迭代 #18 — Phase 4.3b-1 隐私复核与前端错误体验统一

- 日期：2026-10-22（README 推送时间按实际推送记为 2026-10-22 09:04 Asia/Shanghai）
- 目标：完成 Phase 4.3b-1——基于仓库事实的隐私复核文档、首页数据/隐私说明、健康检查离线重试，以及前端网络/HTTP/非 JSON 错误文案统一；纯前端与文档增量，不新增依赖、不改后端代码/契约、不做后端持久化、不上传用户数据。
- 任务选择：MAC-76（迭代 #18，Phase 4.3b-1）。
- 分支：`iter/18`，基于 `dev` 的 `a8e0542e0e59ea4e9438130b0791eb23d777a7fc`。只在该分支提交并 push，不合并、不 force push、不改写历史。
- 产品决策：
  - 本轮只做 Phase 4.3b-1；后端英文校验错误文案中文化留到 4.3b-2，axe/WCAG 审计与图表/分析/导出/项目快照行为不变。
  - 错误处理抽取共享助手，保持各 HTTP 状态、`detail` 解析、兜底文案、导出名称/类型/请求字段与端点完全不变；请求取消（`AbortError`）必须原样抛出。
  - 隐私说明只写代码可核验的事实，不增加“绝对安全”等未经验证的承诺；详细证据集中在 `docs/PRIVACY.md`。
- 已完成：
  - `frontend/src/lib/api.ts`：
    - 新增内部常量 `NETWORK_ERROR_MESSAGE` 与非 JSON 文案常量，新增 `isAbortError` 与通用表单 POST 助手 `postFormJson`。
    - `uploadDataset`、`createSeries`、`createFit` 改用 `postFormJson`，保持 `AbortError` 原样抛出、`detail` 字符串/数组（`；` 连接）解析、各动作中文兜底、200 非 JSON 中文解析错误与 `CsvUploadError.status`。
    - `fetchHealth` 网络失败返回“无法连接分析服务，请确认后端已启动后重试。”；非 2xx 返回“分析服务不可用（HTTP n），请确认后端已启动后重试。”；200 非 JSON 返回“服务器返回了无法解析的响应，请稍后重试。”；`AbortError` 原样抛出。
    - 所有既有导出名称、类型、请求字段和端点保持不变。
  - `frontend/src/App.tsx`：
    - 健康检查抽取为 `checkHealth`，`useEffect` 首次调用；失败显示 `API 未连接`、`data-testid="api-offline-hint"` 的本机地址提示与 `data-testid="api-retry"` 的“重试连接”按钮。
    - 重试时徽标显示“正在检查 API”且按钮禁用；成功后提示与按钮消失、徽标显示 `API 已连接 · v<version>`；失败保持离线态并可再次重试。
    - `#trust` 正文改为恰好 4 条 `data-testid="privacy-list"` 中文隐私说明，覆盖本机 `/api/datasets/*`、无第三方统计/AI、后端不保存文件/不写数据库、`.labflow.json` 只含配置与 SHA-256 指纹。
    - `#roadmap` 剩余工作改为“后端校验错误文案中文化，以及外部试用与跨浏览器验证”，不再列出已完成的“示例与引导”和“隐私复核”；保留 skip-link、锚点、响应式布局、Phase 4 标题与既有 testid。
  - `frontend/src/lib/api.test.ts`（新建，15 项）：覆盖 `fetchHealth` 成功/503/网络失败/200 非 JSON/AbortError，上传网络失败、`detail` 字符串与数组、500 非 JSON、200 非 JSON、AbortError 原对象，以及 `createSeries`/`createFit` 的网络错误与各自兜底文案。
  - `frontend/src/App.test.tsx`：新增离线提示、重试中禁用、恢复在线后提示/按钮消失；隐私列表恰好 4 条与关键信息；路线图不再出现“示例与引导”“隐私复核”且包含“后端校验错误文案中文化”。
  - `docs/PRIVACY.md`（新建，中文）：记录复核范围与结论、6 条数据流、内存处理/10 MB/无落盘/无浏览器存储、无第三方脚本与追踪、项目文件内容清单、已知限制，以及本轮实际执行的 grep/文件检查命令与结果。
  - 文档：更新 `docs/PRODUCT_ROADMAP.md`（拆分 4.3b-1/4.3b-2）、中文 `README.md`（状态、能力、测试、限制、下一轮、版本迭代表）与本记录。
- 测试：
  - 后端：`.venv/bin/python -m pytest -q -o addopts=""` **155 passed**；`.venv/bin/ruff check app tests` 通过；本轮未改后端。
  - 前端：`pnpm typecheck` 通过；`pnpm test:run` **174 passed**；`pnpm build` 成功。
  - 新增覆盖：健康检查四种失败/成功路径与 AbortError；三类 POST 的网络错误、detail 透出/数组连接、非 JSON 兜底与 AbortError 原对象；首页离线重试状态机；隐私列表数量/内容；路线图过期文案移除。
- 已知限制：
  - 后端用户可见校验错误（如 CSV/XLSX 超限、内容类型不支持）仍可能为英文，安排在 4.3b-2。
  - 本地 MVP 默认无 TLS、鉴权、速率限制或租户隔离；部署到真实服务器前需重新做隐私与安全复核。
  - 离线提示固定指向 `http://127.0.0.1:8000`；更换主机或端口需同步修改文案。
  - 未做 axe/WCAG 审计、渗透测试或真实服务器部署验证；浏览器/系统下载记录不在应用控制内。
  - 仍不做后端持久化、账户、云同步或跨设备共享；本轮不改变分析、绘图、导出或项目快照计算行为。
- 下一轮：Phase 4.3b-2 后端用户可见校验错误文案中文化，保持状态码与响应结构不变，并补充后端与前端断言；随后进入外部试用与跨浏览器验证。
- Git：
  - `iter/18` 功能与测试提交：`6a1c5636fb86e025934c52d25bcff53d08c5a50b`
    https://github.com/CubicZnS/labflow/commit/6a1c5636fb86e025934c52d25bcff53d08c5a50b
  - `iter/18` 文档提交：`03fde8df1ea02eec4e285f072113c1582ea82262`
    https://github.com/CubicZnS/labflow/commit/03fde8df1ea02eec4e285f072113c1582ea82262
  - 推送后核验：`git ls-remote origin refs/heads/iter/18` 返回
    `03fde8df1ea02eec4e285f072113c1582ea82262`，与本地 `git rev-parse HEAD` 一致；本提交仅补记
    上述真实 SHA 与远端 HEAD，推送后远端 HEAD 会前进到本补记提交。
  - 推送核验：分支基于 `a8e0542e0e59ea4e9438130b0791eb23d777a7fc`，无 force push、无历史改写；
    `dev` 与 `main` 未改动。
  - `iter/18` 最终 HEAD：`fe47c873b942bcf24e1da0f577540969435d4144`
    https://github.com/CubicZnS/labflow/commit/fe47c873b942bcf24e1da0f577540969435d4144
    （`git ls-remote origin refs/heads/iter/18` 与 `gh api` 一致）。
  - 独立 QA：MAC-77 **PASS**。QA 独立核验 A1–A3、B4–B8、C9–C12、D13–D17、E18–E21 共 21 项：远端 3 个提交与 `dev`/`main` 基线、8 个允许路径、无依赖/后端/CI 改动、错误矩阵与 `AbortError` 原对象、离线重试状态机、4 条隐私说明与事实 grep、`#roadmap` 过期文案、中文 README/版本迭代表/迭代记录、5 项门禁（后端 155 passed + ruff，前端 174 passed + build），并做 3 项变异抽查（移除 AbortError 分支、删除离线提示 testid、隐私列表改为 3 条）均使对应测试失败。无阻断问题。
  - QA 非阻断观察与处理：`api.ts` 末尾缺换行（沿袭旧文件，本轮未改）；`docs/PRIVACY.md` 对 CSV 解析与框架临时缓冲的描述不够精确，已在本轮记录提交中按 QA 反馈修正为 `io.StringIO`（字段数校验）+ `pd.read_csv(io.BytesIO)`（解析），并补充 Starlette `SpooledTemporaryFile` 的框架级临时缓冲说明，不影响“应用不持久化、不上传第三方”的结论。
  - `dev` 合并提交：`05f1cdbae2e258fbd8947511e20fed6983fa5251`
    https://github.com/CubicZnS/labflow/commit/05f1cdbae2e258fbd8947511e20fed6983fa5251
  - 合并后在 `dev` 重跑 5 个 gate：后端 `pytest -q -o addopts=""` **155 passed**、`ruff check app tests` 通过；前端 `typecheck` 通过、`test:run` **174 passed**、`build` 成功。
  - 阶段状态：Phase 4.3b-1（隐私复核与前端错误体验统一）完成并合并；Phase 4 MVP 产品化仍在进行，下一轮进入 Phase 4.3b-2 后端用户可见校验错误文案中文化。
  - 迭代记录提交：`5f7f6feb19168bfcd70f653ae39eb9a91012ed0e`
    https://github.com/CubicZnS/labflow/commit/5f7f6feb19168bfcd70f653ae39eb9a91012ed0e
  - 推送核验：`git ls-remote origin refs/heads/dev` 在补记前返回 `5f7f6feb19168bfcd70f653ae39eb9a91012ed0e`，与 `gh api` 对合并提交 `05f1cdbae2e258fbd8947511e20fed6983fa5251` 和记录提交的返回一致；`main` 保持 `7b3c2f1153eb561241ba33fa74e06953e552e63e` 未改动；无 force push、无历史改写。本补记提交只补充上述记录提交 SHA 与推送核验，推送后 `dev` HEAD 前进到本补记提交。

## 迭代 #19 — Phase 4.3b-2 后端用户可见校验错误与警告文案中文化

- 日期：2026-10-22（README 推送时间按实际推送记为 2026-10-22 10:03 Asia/Shanghai）
- 目标：把后端所有用户可见的校验错误 `detail` 与导入/配对/拟合 `warnings` 统一为中文，同时保持 HTTP 状态码、响应字段/结构、端点、计算行为与数值结果完全不变；不新增依赖、不改前端、不做后端持久化、不上传用户数据。
- 任务选择：MAC-79（迭代 #19，Phase 4.3b-2）。
- 分支：`iter/19`，基于 `dev` 的 `27ad96e6e75de6fb0fe3376190c1fd3c1e0e4923`。只在该分支提交并 push，不合并、不 force push、不改写历史。
- 产品决策：
  - 状态码（400/413/415/422/200）、响应字段、端点、数值计算和 `.labflow.json` 契约全部保持不变，只替换面向用户的文案。
  - 技术记号按需保留英文：CSV、XLSX、X、Y、χ²、σ²、1/σ²、`y_error_column`、`degree` 的数值等；拟合方程 `equation` 是数值表达，不属于错误文案，未改动。
  - 动态插值必须保留：列名、计数、10 MB 上限、工作表名、条件数、约化 χ² 等继续出现在中文句子中。
  - `README.md` 虽不在实现任务原始允许文件清单内，但全局强制规范要求每轮同步中文 README 与版本迭代表，因此接受该必要例外；`docs/**` 仍由 Lead 在验收后记录。
- 已完成：
  - `backend/app/datasets.py`：CSV 格式错误/空文件/10 MB 超限/无数据行，XLSX 格式错误/空文件/超限/无工作表/工作表无数据，以及缺失值、重复行、非数值、非有限值、多工作表警告全部改为中文。
  - `backend/app/series.py`：非法格式、单位超长、列不存在/非数值、X=Y、有效配对不足、配对跳过警告全部改为中文。
  - `backend/app/fitting.py`：`degree` 非法/越界、Y 误差列为空/仅有单位、配对不足、X 值不变、误差列与 X/Y 冲突、误差列缺失/非有限/非正、1/σ² 权重非有限，以及恰好确定/病态/约化 χ² 三类警告全部改为中文。
  - `backend/app/main.py`：内容类型不支持与文件格式不支持文案改为中文（`content_type` 为空时仍显示 `unknown`）。
  - `backend/app/analysis.py`：纯函数校验错误全部改为中文，保留 `x`、`y`、`y_errors` 等技术标识。
  - 测试：现有英文断言更新为中文关键字断言；新增 CSV 超限与 XLSX 无工作表回归用例；覆盖任务列出的错误与警告类别（缺失值、重复行、非数值、非有限值、多工作表、配对跳过、三类拟合警告等）。
  - 文档：更新中文 `README.md` 当前状态、当前能力、已知限制、下一轮与“版本迭代记录”表（迭代 #19）；本记录为中文。
- 测试：
  - 后端：`.venv/bin/python -m pytest -q -o addopts=""` **157 passed**（基线 155，新增 2 项）；`.venv/bin/ruff check app tests` 通过。
  - 前端：`pnpm typecheck` 通过；`pnpm test:run` **174 passed**；`pnpm build` 成功；本轮未改前端。
  - Lead 独立复核：逐项对照任务文案映射检查 `analysis/datasets/series/fitting/main` 的实际字符串，未发现遗漏的英文用户可见 `detail`/`warnings`；确认状态码与响应结构未改；本地重跑后端 157 passed 与 ruff 通过。
- 已知限制：
  - 仍不做后端持久化、账户、云同步或跨设备共享；本轮不改变分析、绘图、导出或项目快照计算行为。
  - 第三方库（pandas/openpyxl）抛出的底层异常文本可能仍含英文，但外层统一使用中文前缀（如“CSV 格式错误：…”），便于用户理解。
  - 本地 MVP 默认无 TLS、鉴权、速率限制或租户隔离；未做 axe/WCAG、渗透测试或真实服务器部署验证。
  - 外部试用与跨浏览器人工验证尚未开始。
- 下一轮：Phase 4.4 发布前跨浏览器与外部试用准备。先做本地可验证的静态兼容性复核（Safari/Firefox 关键 CSS 与下载/剪贴板/文件 API 回退）与中文试用手册/检查清单，再进行真实外部试用；真实用户招募与生产部署需另行授权。
- Git：
  - `iter/19` 实现、测试与 README 提交：`18dcc92dfd9cd09ba2ac9816af56a431d33a5caf`
    https://github.com/CubicZnS/labflow/commit/18dcc92dfd9cd09ba2ac9816af56a431d33a5caf
  - `iter/19` 迭代记录与路线图提交（QA 前 HEAD）：`e26a268f7a5bf2f8dfe00e0267fb264c264b1950`
    https://github.com/CubicZnS/labflow/commit/e26a268f7a5bf2f8dfe00e0267fb264c264b1950
  - 推送核验：`git ls-remote origin refs/heads/iter/19` 在合并前返回
    `e26a268f7a5bf2f8dfe00e0267fb264c264b1950`；`gh api` 对 `e26a268` 与 `18dcc92dfd9cd09ba2ac9816af56a431d33a5caf`
    返回一致；`main` 保持 `7b3c2f1153eb561241ba33fa74e06953e552e63e` 未改动；无 force push、无历史改写。
  - 独立 QA：MAC-81 **PASS**。QA 独立核验 A1–A8 共 8 组：远端 SHA 与基线（`dev` 27ad96e、`main` 7b3c2f1、ahead 2）、12 个变更文件与禁止路径零改动、全部 `detail`/`warnings` 中文化且无遗漏英文、状态码计数与响应契约不变、断言更新与新增回归、2 项变异抽查（英文文案回退、413 改 400）均能捕获失败并恢复干净、后端 157 passed + ruff、前端 typecheck/174 passed/build、中文 README/版本迭代表/迭代记录/路线图。结论无阻断问题。
  - QA 非阻断观察：第三方库异常正文可能含英文（外层中文前缀）；`content_type` 为空显示 `unknown`；路线图正文仍为英文（强制中文范围仅 README 与迭代记录）。
  - `dev` 合并提交：`afaf85e08688ffd97eb29cf8ef326500ed9eefaf`
    https://github.com/CubicZnS/labflow/commit/afaf85e08688ffd97eb29cf8ef326500ed9eefaf
  - 合并后在 `dev` 重跑 5 个 gate：后端 `pytest -q -o addopts=""` **157 passed**、`ruff check app tests` 通过；前端 `typecheck` 通过、`test:run` **174 passed**、`build` 成功。
  - 推送核验：`git ls-remote origin refs/heads/dev` 返回合并提交 `afaf85e08688ffd97eb29cf8ef326500ed9eefaf`，与 `gh api` 对同一 SHA 的返回一致；`main` 未改动。
  - 阶段状态：Phase 4.3b-2（后端用户可见校验错误与警告文案中文化）完成并合并；Phase 4 MVP 产品化仍在进行，下一轮进入 Phase 4.4 发布前跨浏览器与外部试用准备。
