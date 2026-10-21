# LabFlow

LabFlow 是面向大学生、研究生、科研工作者和实验室的科研数据分析与绘图 SaaS。
目标是把原始实验数据整理、校验、统计、拟合、绘图和报告输出的重复劳动降到最低，
同时让每一步计算都可追溯、可复现。

> 当前状态：Phase 3.3（迭代 #11）。项目已经具备 CSV/XLSX 导入、数据校验、汇总统计、
> X/Y 配对、线性/二次/三次拟合、系数不确定度、病态诊断、Y 误差加权拟合，
> 以及基于配对结果的 SVG 散点图（自动坐标范围、刻度、轴标签与单位）、
> 拟合曲线叠加、Y 误差棒，以及图表标题、网格开关、稀疏/标准/密集刻度密度和小/中/大字号控制。
> 多系列、PNG/SVG 导出、项目持久化、认证、真实收费和生产部署尚未完成。

## 版本迭代记录

| 版本号 | 推送时间（Asia/Shanghai） | 新增内容 | 修复内容 |
|---|---|---|---|
| 迭代 #0 | 2026-10-21 13:23 | 初始化私有仓库、FastAPI/React 骨架、确定性分析、CI 和产品文档 | 首次初始化，无 |
| 迭代 #1 | 2026-10-21 13:32 | CSV 导入/校验/预览/警告接口；数据质量检查 | 修复不规则 CSV 行导致字段静默错位（`fba7414`） |
| 迭代 #2 | 2026-10-21 13:40 | CSV 上传与预览 UI、示例数据、加载/错误状态 | 无独立修复提交；补齐上传失败和缺失值展示 |
| 迭代 #3 | 2026-10-21 14:06 | 数值列汇总统计（n/均值/样本标准差/标准误）和统计面板 | 无独立修复提交；补齐无数值列和有效值不足状态 |
| 迭代 #4 | 2026-10-21 16:17 | XLSX 导入、与 CSV 共享校验/统计契约、前端按扩展名路由 | 修复重复表头导致 500（`7446abb`）；修复有数据支撑的空表头被误删（`fcf7139`） |
| 迭代 #5 | 2026-10-21 18:13 | X/Y 配对、单位、配对序列 API 和配对面板 | 修复 XLSX datetime 被当作数值、与 CSV 行为不一致（`ae91783`） |
| 迭代 #6 | 2026-10-21 20:08 | 线性/二次/三次拟合接口与拟合面板；方程、R²、残差、RMSE | 无独立修复提交；补齐 degree/列/格式/10 MB 错误矩阵 |
| 迭代 #7 | 2026-10-21 22:09 | 系数标准误、95% 置信区间、残差自由度、条件数与病态诊断 | 无独立修复提交；精确决定拟合改为 null + 警告，避免伪不确定度 |
| 迭代 #8 | 2026-10-21 23:37 | Y 误差列加权拟合、χ²/约化 χ²、误差传播、加权拟合 UI | 修复 `y_error_column` 空串返回 200、静默退化为等权拟合（`93a1013`） |
| 迭代 #9 | 2026-10-22 00:11 | SVG 散点图：自动 X/Y 范围、4–6 个刻度、轴标签与单位、空数据/单点提示；Phase 3 页面文案 | 修复独立 QA 发现的单点/全同值仅 3 个刻度与极端有限值域溢出；补齐刻度回退与可表示范围保护 |
| 迭代 #10 | 2026-10-22 01:06 | 拟合曲线叠加（可见 X 域 101 点确定性采样）、Y 误差棒、自动 Y 范围纳入曲线与误差端点、series 代次隔离；中文 README 与迭代记录同步 | 修复旧 series 的拟合结果回写到新 series（`dd83630`）；修复高次拟合曲线越界覆盖坐标轴/标签（`dd83630`） |
| 迭代 #11 | 2026-10-22 02:06 | 中文图表标题（空标题不占位）、默认关闭的虚线网格、稀疏/标准/密集三档刻度密度、小/中/大字号；样式控件实时生效且不重新请求 series | 无独立修复提交 |

> 版本号当前使用迭代号（尚未打语义化 Git tag）；推送时间取该轮 README 更新提交的实际推送时间（Asia/Shanghai；迭代 #11 为 2026-10-22 02:06）。完整证据、commit SHA 和 GitHub 链接见 [迭代记录](docs/ITERATION_LOG.md)。

## 当前能力

- **数据导入**：CSV、XLSX、示例数据和前 10 行预览。
- **数据校验**：缺失值、重复行、非数值列、非有限值和不规则行警告/错误。
- **汇总统计**：n、缺失数、均值、样本标准差（ddof=1）、标准误。
- **X/Y 配对**：选择数值列、可选单位、跳过行计数、配对序列预览。
- **曲线拟合**：线性、二次、三次；方程、R²、系数、残差、RMSE、最大绝对残差。
- **拟合不确定度**：系数标准误、95% 置信区间、残差自由度和条件数/病态警告。
- **加权拟合**：可选 Y 误差列和单位，按 `1/σ²` 加权，输出 χ²、约化 χ² 和误差传播。
- **SVG 散点图**：基于 series 配对结果内联绘制，自动 X/Y 范围（约 5% 边距）、4–6 个标准刻度、
  轴标签与单位、空数据和单点提示；非有限点自动过滤，不引入第三方图表库。
- **图表样式**：可选中文标题（空白标题不渲染、不占位）、默认关闭的虚线网格（按刻度位置绘制）、
  稀疏（3–4）/标准（4–6）/密集（6–9）三档刻度密度，以及小/中/大三档字号；样式变化只影响显示，
  不改变坐标域、点位、拟合曲线或误差棒像素坐标，也不触发新的 series 请求。
- **拟合曲线与误差棒**：拟合成功后按系数在可见 X 域确定性采样 101 点绘制曲线；加权拟合时
  为每个有限配对点绘制 Y 误差棒（±σ）；自动 Y 范围同时覆盖误差端点与曲线采样值。
- **中文优先 UI**：响应式布局、上传/统计/配对/拟合/绘图面板和清晰错误提示。

## 尚未完成

- 手工表格录入与编辑。
- 多系列叠加与图片导出（PNG/SVG）；当前样式控制仅作用于单系列图表（Phase 3.3 后续–3.4）。
- 项目保存/重开/重跑（Phase 4）。
- 用户账户、团队协作、云同步、真实计费和 PIP 生产部署。

## 下一轮计划

完成 Phase 3.3 的多系列叠加，并在 Phase 3.4 完成 PNG/SVG 导出；继续保持确定性计算、中文优先、
样式控件不改变数值坐标且无新增第三方图表依赖。

## 技术栈

- 前端：React 19、TypeScript、Vite、Tailwind CSS
- 后端：Python 3.12、FastAPI、NumPy、Pandas、SciPy、openpyxl
- 测试：Pytest、Vitest
- CI：GitHub Actions
- 存储：SQLite 计划用于 Phase 4；当前接口不落库

## 快速开始

### 后端

```sh
cd backend
PYTHON_BIN=${PYTHON_BIN:-python3}
$PYTHON_BIN -m venv .venv
.venv/bin/pip install -e ".[dev]"
.venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

健康检查：<http://127.0.0.1:8000/api/health>

需要 Python 3.12+。如果系统 `python3` 较旧，请把 `PYTHON_BIN` 指向 3.12+ 解释器。

### 前端

```sh
cd frontend
pnpm install
pnpm dev
```

打开 <http://127.0.0.1:5173>。Vite 会把 `/api` 代理到 8000 端口。

### Docker

```sh
docker compose up --build
```

- 前端：<http://127.0.0.1:8080>
- 后端：<http://127.0.0.1:8000/api/health>

仓库已提供 Dockerfile/nginx 代理配置。当前开发用 Mac mini 未安装 Docker，容器路径尚未做冒烟验证；
本地开发请使用上面的后端/前端命令。

## 测试与质量

```sh
cd backend && .venv/bin/python -m pytest -q
cd backend && .venv/bin/ruff check app tests
cd frontend && pnpm typecheck
cd frontend && pnpm test:run
cd frontend && pnpm build
```

截至迭代 #11：

- 后端：155 个测试通过，ruff 通过。
- 前端：57 个测试通过，typecheck/build 通过。
- GitHub Actions：后端 lint/test 和前端 typecheck/test/build 均通过。

数值测试使用已知值或独立公式基线；AI 输出不作为数值正确性的判据。

## API 概览

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/health` | 健康检查 |
| POST | `/api/analysis/stats` | 对一组数值做均值/样本标准差/标准误 |
| POST | `/api/analysis/fit` | 对 X/Y 数组做 1–3 次拟合 |
| POST | `/api/datasets/csv` | 上传 CSV，返回校验、预览、统计和警告 |
| POST | `/api/datasets/xlsx` | 上传 XLSX，契约与 CSV 一致 |
| POST | `/api/datasets/series` | 选择 X/Y 列和单位，返回配对序列 |
| POST | `/api/datasets/fit` | 对导入数据集拟合，支持不确定度和 Y 误差加权 |

## 目录结构

```text
backend/       FastAPI 应用、确定性分析和拟合代码
frontend/      React 应用、上传/统计/配对/拟合/绘图面板（含 ScatterPlot）
docs/          路线图、架构、测试、商业模型、决策、迭代记录
.github/       CI 工作流
```

## 迭代与 Git 规则

- `main` 只保留稳定版本，由人工批准合并/发布。
- 每轮开发从 `dev` 创建 `iter/N`，Dev 提交并 push，独立 QA 通过后由 Lead 合并到 `dev`。
- 禁止 force push、重写历史、直接推 `main`、提交密钥或用户数据。
- **每轮版本更新必须同步更新本 README，且 README 使用中文。**
- **每轮必须更新 `docs/ITERATION_LOG.md`，记录真实目标、改动、测试、分支、commit SHA、链接、已知问题和下一轮。**
- 从迭代 #8 起，commit message 使用中文：`迭代 #N：<中文摘要>`；merge/记录 commit 也使用中文。
- QA 必须检查 README 是否更新且为中文，以及迭代记录是否完整；缺失则判 FAIL。

## 如何查看版本记录

```sh
# 简洁历史
git log --oneline --graph --decorate

# 只看开发分支
git log --oneline --decorate dev

# 查看某次提交
git show <SHA>
```

- GitHub Commits：<https://github.com/CubicZnS/labflow/commits/dev>
- 中文迭代记录：`docs/ITERATION_LOG.md`
- 中文提交索引：在 `docs/ITERATION_LOG.md` 顶部，把旧英文 commit message 映射为中文说明

## 文档

- [产品路线图](docs/PRODUCT_ROADMAP.md)
- [架构说明](docs/ARCHITECTURE.md)
- [测试策略](docs/TESTING.md)
- [商业模型](docs/BUSINESS_MODEL.md)
- [架构与产品决策](docs/DECISIONS.md)
- [Agent 运行模型](docs/AGENT_OPERATING_MODEL.md)
- [迭代记录](docs/ITERATION_LOG.md)

## 安全与边界

- 不把 API Key、Token、数据库凭据或用户数据提交进 Git。
- 当前不启用真实收费，不购买服务器/域名/API Credits，不做生产部署。
- 实验数据默认本地处理；MVP 不把数据送到第三方 AI 服务。
- 数值结果由确定性代码计算；AI 只可做解释和引导。

## 当前限制

- 仅支持逗号分隔 UTF-8 CSV 和首个 XLSX 工作表。
- 上传上限 10 MB，文件在大小检查前已读取。
- 拟合不确定度基于独立同分布误差假设；加权拟合把输入的 σ 视为绝对误差。
- 散点图支持单系列数据点、拟合曲线、Y 误差棒、标题、网格、三档刻度密度与三档字号；暂不支持多系列或图片导出。
- 网格默认关闭，开启后按当前刻度位置绘制虚线参考线；本轮不提供手动坐标范围、图例位置或颜色编辑。
- 拟合曲线覆盖当前可见 X 域（含约 5% 边距），自动 Y 范围会包含曲线采样值；误差棒把 σ 视为绝对误差。
- 旧 series 的拟合结果由 series 代次隔离，不会回写到新 series。
- 中文 UI 中部分后端校验消息/警告仍为英文。
- 当前是开发阶段，没有真实用户、收入或市场验证数据。
