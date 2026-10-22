# 发布前兼容性复核与中文试用检查清单

## 范围与结论边界

迭代 #20，复核日期 2026-10-22；代码基线 `c8644e21746916f432e1d3ea6858e663df45365f`，分支 `iter/20`。
本轮只阅读仓库代码、准备本地人工脚本并运行自动化门禁；没有实际运行 Chrome/Safari/Firefox 人工矩阵，没有外部用户验收或指标。静态推断不能证明浏览器兼容，Phase 4 MVP 尚未完成。
迭代 #21 的真实 Firefox headless 自动化结果见文末独立记录；以下 #20 静态结论及人工矩阵不据此改填。
本手册不授权招募、部署、付费服务或对外发送邀请；实际招募与部署须另行授权。下一步为执行人工矩阵，并处理证据支持的兼容问题。

## 静态能力清单（不是浏览器实测结果）

以下相对链接均指实际源文件；函数名/选择器便于代码移动后定位。未给出最低浏览器版本承诺。

| 实际能力与证据 | 已有保护或回退 | 限制、待验证点 |
|---|---|---|
| CSS Grid/Flex、响应式断点、gap：[导入面板](../frontend/src/components/CsvImportPanel.tsx) 的 `grid`/`flex`/`lg:grid-cols`；[首页](../frontend/src/App.tsx) | 小屏基础单列，大屏断点分列；预览表 `overflow-x-auto` | 没有旧浏览器布局 polyfill；320px/768px/1280px 与 200% 缩放检查遮挡、横向滚动、按钮可达性 |
| `backdrop-filter`：[index.css](../frontend/src/index.css) `.card` 的 `backdrop-blur`、[首页](../frontend/src/App.tsx) sticky header | 已有半透明背景、边框与阴影；不支持模糊时这些声明仍存在 | 没有专用 `@supports` 替代样式；实际清晰度、sticky 遮挡和对比度待测 |
| 平滑滚动、`:focus-visible`、`prefers-reduced-motion`：[index.css](../frontend/src/index.css) | reduce 偏好下 `scroll-behavior:auto`；跳转链接还用 `:focus` 显示；原生控件和部分 focus ring | 无完整可访问性审计；旧环境不支持媒体查询/选择器时无等价全局回退，须键盘及系统减少动态效果检查 |
| 内联 SVG、viewBox、clipPath：[ScatterPlot.tsx](../frontend/src/components/ScatterPlot.tsx)；XMLSerializer：[chartExport.ts](../frontend/src/lib/chartExport.ts) `serializeChartSvg` | 克隆当前 SVG、显式尺寸/命名空间、删除 class、插入白底；无效 viewBox 尺寸回退 640×360 | 无 XMLSerializer polyfill；中文字体由系统提供，字形/裁切待测；HTML 图例在 SVG 外，导出不含图例 |
| Blob/object URL/`a.download`：[chartExport.ts](../frontend/src/lib/chartExport.ts) `defaultDownloadBlob` 与 [projectSnapshot.ts](../frontend/src/lib/projectSnapshot.ts) `downloadProjectSnapshot` | 临时 anchor 插入、点击、移除；finally 回收 URL；文件名清洗 | 没有下载 API 替代路径；URL 在点击后立即回收，异步消费/浏览器下载策略可能影响落盘，须实测。页面成功仅表示触发下载，不证明文件存在或完整 |
| `Image` → canvas 2D → `toBlob`：[chartExport.ts](../frontend/src/lib/chartExport.ts) `defaultLoadImage`/`svgToPngBlob` | 图片 onerror 拒绝；canvas/context 不可用、toBlob 缺失或返回 null 显示中文失败；先白底再绘图；finally 回收 SVG URL | 无栅格替代实现、无图片加载超时；异步下载的用户激活策略、中文字体与 1×/2×/3× 结果须测；失败可另点 SVG 导出 |
| `File` 构造与 `Response.text`：[CsvImportPanel.tsx](../frontend/src/components/CsvImportPanel.tsx) `handleLoadSample` | 捕获示例 GET/构造失败，中文提示，可重试或手动选文件 | 不等于 `File.text`；无 File 构造 polyfill，手动上传需另验 |
| `File`/Blob `.text()`、`.arrayBuffer()`：[projectSnapshot.ts](../frontend/src/lib/projectSnapshot.ts) `readBlobAsText`/`readFileBytes` | 分别回退 FileReader.readAsText/readAsArrayBuffer；读取失败中文错误；项目文件 256 KB 上限、严格 schema 校验 | FileReader 也不可用则失败；兼容分支单元测试不代替真实文件选择器验证 |
| Web Crypto SHA-256：[projectSnapshot.ts](../frontend/src/lib/projectSnapshot.ts) `sha256Hex` | 检查 `globalThis.crypto?.subtle`，缺失明确报“当前环境不支持 SHA-256 计算”；复制字节后 digest，不使用弱哈希 | 依赖安全上下文；使用本机 loopback 地址并检查 `window.isSecureContext`、`crypto.subtle`。普通局域网 HTTP 不能当成等价环境；没有安全上下文自动修复或算法回退 |
| fetch/FormData/AbortSignal：[api.ts](../frontend/src/lib/api.ts)；AbortController：[App.tsx](../frontend/src/App.tsx) effect | 健康检查卸载时 abort；api 层保留 AbortError，统一网络/HTTP/非 JSON 中文错误；[SeriesPanel.tsx](../frontend/src/components/SeriesPanel.tsx) 用代次隔离旧结果 | 无 AbortController polyfill，构造发生在 effect；无通用超时机制。api 支持 signal 不代表所有上传/重跑均主动取消；停止后端和快速切换数据需测 |

复核未发现应用源码使用 File System Access API、OffscreenCanvas、Service Worker 或 Web Storage；不应把它们写成现有能力。离线重试只恢复后端连接，不提供离线分析。

### 风险复现与后续建议（本轮不改代码）

- 下载风险：按下面 T06/T07 在每种浏览器触发 SVG、三档 PNG 和项目下载；若有成功提示但无文件，记录下载设置、控制台、文件大小与操作录像。定位 `defaultDownloadBlob`/`downloadProjectSnapshot` 的立即 `revokeObjectURL`；后续仅在证据支持时评估延迟回收或独立下载入口。
- 图片等待：T06 若长期停留“正在导出…”，记录浏览器/文件与控制台。定位 `defaultLoadImage` 无超时；后续评估超时及重试。未在真实浏览器复现。
- 连接异常：T10 停止后端应快速拒绝；若请求一直 pending，定位 `api.ts` fetch 与 `App.tsx` checkHealth，无请求超时；后续按证据评估超时，不把断网等同于全部请求可取消。
- 页面文案边界：`CsvImportPanel.tsx` 的“文件只用于本地解析”是指本机服务，不是纯浏览器解析；`App.tsx` 的“导出…与数据”不代表已有原始数据导出。试用按本手册/README 的实际边界解释；后续可单独收敛文案。

## 本地环境与合成输入准备

环境：Python 3.12+、Node 20+、已安装仓库依赖；两个终端分别在仓库根目录启动，不对外绑定端口。安装方法见 [README](../README.md#快速开始)。本机固定工具路径如下，其他获授权本地环境用等价 pnpm。

```sh
cd backend
.venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

```sh
cd frontend
/Users/zhangzimo/.local/bin/pnpm dev --host 127.0.0.1
```

打开 `http://127.0.0.1:5173`，健康接口 `http://127.0.0.1:8000/api/health` 应返回 JSON。不要用 `file://` 打开构建文件。只用合成数据，不选真实研究文件或用户数据。
下列命令在仓库根目录运行，将样例写入新建的系统临时目录（不是仓库提交内容）；记录终端打印路径。CSV/XLSX 内容相同，空单元格用于警告，另提供错误 CSV、非正误差和改动后的指纹拒绝样例。

```sh
backend/.venv/bin/python - <<'PY'
from pathlib import Path
import csv
import tempfile
from openpyxl import Workbook
folder = Path(tempfile.mkdtemp(prefix="labflow-trial-"))
rows = [["x", "y", "sigma", "y2", "y3", "y4", "note"],
        [0, 1, 0.5, 2, 3, 4, "合成"], [1, 3, 0.5, 4, 6, 8, ""],
        [2, 5, 0.5, 6, 9, 12, ""], [3, 7, 0.5, 8, 12, 16, ""],
        [4, 9, 0.5, 10, 15, 20, ""], [5, None, 0.5, 12, 18, 24, "缺失"]]
with (folder / "trial.csv").open("w", encoding="utf-8", newline="") as f:
    csv.writer(f).writerows(rows)
book = Workbook()
for row in rows:
    book.active.append(row)
book.save(folder / "trial.xlsx")
(folder / "bad.csv").write_text("x,y\n1,2,3\n", encoding="utf-8")
changed = [row[:] for row in rows]
changed[1][1] = 2
with (folder / "changed.csv").open("w", encoding="utf-8", newline="") as f:
    csv.writer(f).writerows(changed)
invalid = [row[:] for row in rows]
invalid[1][2] = 0
with (folder / "invalid-error.csv").open("w", encoding="utf-8", newline="") as f:
    csv.writer(f).writerows(invalid)
print(folder)
PY
```

## 人工执行矩阵（全为待执行；不含 headless 自动化）

每个浏览器独立执行 T01–T10；版本和 OS 填完整版本，结果逐项填 PASS/FAIL/受阻，附证据，不能由静态审查或 Vitest 代填。Safari 使用可运行 Safari 的本机环境；没有可用环境就记受阻。

| 浏览器 | 完整版本 | OS/版本 | 执行日期（含时区） | 执行人 | T01–T10 结果/证据 |
|---|---|---|---|---|---|
| Chrome | 待执行 | 待执行 | 待执行 | 待执行 | 待执行 |
| Safari | 待执行 | 待执行 | 待执行 | 待执行 | 待执行 |
| Firefox | 待执行 | 待执行 | 待执行 | 待执行 | 待执行 |

## 本地操作脚本与可观察预期

T01–T08 在同一个浏览器中顺序操作；每次换输入文件都点“上传并解析”。刷新或重新导入后，必须先选 X=x、Y=y 并生成成功配对，首次项目区域与“打开项目”入口才会显示；仅解析文件不会显示项目区域。项目打开会再按快照设置重跑，前置配对不代替重跑。除脚本明确要求外不要刷新丢失内存状态。下载必须到系统下载目录实际打开检查，不能只读网页成功提示。

| 编号 | 操作 | 可观察预期 |
|---|---|---|
| T01 示例与 CSV/XLSX | 点“载入示例数据”；再选 `trial.csv` 上传；之后用 `trial.xlsx` 重复 | 内置示例 12 行、缺失读数警告；trial 两种格式均 6 行、相同数值列/预览，中文缺失警告；XLSX 仅首表。选择统计列 y | 
| T02 统计与错误 | 查看 y 统计；上传 `bad.csv`；随后重新上传 `trial.csv` | y 有效 n=5、缺失=1、均值=5、样本标准差约 3.162、SEM 约 1.414（界面有舍入）；不规则 CSV 中文错误，无假成功；重新导入可恢复 |
| T03 配对与单位 | X=x、Y=y、X 单位 s、Y 单位 m，生成配对 | 5 个点，跳过 1 行；轴标签含列名和单位；没有缺失点被补零 |
| T04 拟合/误差棒 | 一次拟合不选误差列，再选 sigma、单位 m 拟合；分别选二次/三次运行 | 一次 y=2x+1、R²≈1，系数允许浮点舍入；加权时有 ±0.5 误差棒与 χ²；二/三次结果可见，无崩溃。另上传 `invalid-error.csv` 配对并选 sigma 拟合 | 
| T04b 非正误差 | 接上一步查看中文错误，再重导 trial.csv、配对并完成加权一次拟合 | 非正 sigma 被明确拒绝；恢复正常输入后可拟合。不把接近零的残差当成精确零判断 |
| T05 多系列与样式 | 依次追加 y2/y3/y4，名称“系列二/三/四”；尝试第五个；移除一个再加回。设置标题“中文试用图”、网格开、密集刻度、大字号 | 共最多 4 个系列，颜色/形状和中文 HTML 图例区分；第五个不可添加；样式不改变点位/坐标域、不重发 series；主系列拟合与误差棒仍可见 |
| T06 SVG/PNG | 导出 SVG；依次选择 PNG 1×/2×/3×并各导出；逐个实际打开文件 | 白底、中文标题、轴/单位、点形、曲线、误差棒与网格完整；SVG 可打开，PNG 分别 640×360/1280×720/1920×1080；HTML 图例不包含在导出内（已知限制）；文件非空，名称清洗，图表保持不变 |
| T07 v2 重开 | 名称填“合成试用”、备注填“仅合成数据”、PNG=3×，保存项目；刷新，重导同一 `trial.csv` 并上传解析；选 X=x、Y=y，生成配对成功，确认项目区域显示且操作空闲后，点“打开项目”选择下载文件 | schemaVersion=2；文件只含配置、源文件名和指纹；恢复元数据、单位、系列顺序、样式、倍率并依次主系列→追加→拟合重跑；无原始数据行或拟合结果快照；项目读取本身无上传请求，重跑会提交当前数据到本机后端 |
| T08 v1 迁移/拒绝 | 用下方命令从已保存 v2 生成 v1 和篡改指纹文件；承接 T07 成功重跑，仍在 trial.csv 成功配对状态下打开 v1，再保存；操作空闲后打开篡改指纹文件；最后导入 changed.csv 并上传解析，先选 X=x、Y=y 生成配对成功，待项目区域显示且操作空闲后打开原 v2 | v1 恢复空名称/备注、默认 2×，重新保存为 v2；两种指纹不匹配均中文拒绝、不启动 series/fit、不覆盖当前分析。用网络面板确认拒绝时没有这些 POST；不是仅比较文件名 |
| T09 键盘与布局 | 刷新后只用 Tab/Shift+Tab、Enter/Space、方向键操作跳转链接；选择 trial.csv 并上传解析，选 X=x、Y=y 生成成功配对，再操作拟合、保存/打开/导出；检查 320/768/1280px、200% 缩放和系统减少动态效果 | 首焦点“跳到主要内容”可进入导入区；焦点清晰、无键盘陷阱，控件可达；忙时冲突按钮禁用，长表可横滚，无关键控件被遮挡；reduce 时不平滑滚动。播报支持不等于已做屏幕阅读器审计 |
| T10 离线与重试 | 保持前端运行，后端终端 Ctrl+C；刷新前端，点重试；尝试上传/配对；重启后端，点“重试连接”，重导 trial.csv 并上传解析，选 X=x、Y=y 生成成功配对后继续分析/项目操作；另用网络面板阻止 `/samples/labflow-demo.csv` 后点示例，再解除阻止重试 | “API 未连接”和中文提示；重试期间“正在检查 API”、按钮禁用；失败无假成功。恢复后“API 已连接”、提示消失，上传/示例可重试。单独阻止示例 GET 时既有结果保留；后端解析失败不承诺保留旧结果。无离线分析承诺 |

T08 辅助命令：先把 `saved` 改为 T07 实际下载路径，仅处理合成试用文件；输出到新临时目录。v1 顶层不能残留 v2 专有字段。

```sh
backend/.venv/bin/python - <<'PY'
import json
import tempfile
from pathlib import Path
saved = Path("/替换为实际下载路径/项目.labflow.json")
snapshot = json.loads(saved.read_text(encoding="utf-8"))
folder = Path(tempfile.mkdtemp(prefix="labflow-project-trial-"))
v1 = {k: v for k, v in snapshot.items() if k not in ("metadata", "export")}
v1["schemaVersion"] = 1
(folder / "v1.labflow.json").write_text(json.dumps(v1, ensure_ascii=False), encoding="utf-8")
snapshot["dataset"]["sha256"] = "0" * 64
(folder / "mismatch.labflow.json").write_text(json.dumps(snapshot, ensure_ascii=False), encoding="utf-8")
print(folder)
PY
```

## 外部试用手册（准备稿，尚未外部验收）

由获授权的环境准备者先完成本地启动、样例生成并交付样例目录；试用者只需浏览器和文件选择器，不需要读源码或开发者口头解释。环境准备失败则记受阻，不计作用户完成。

1. 打开上述本机网址，确认“API 已连接”；点击“载入示例数据”，阅读警告和统计。
2. 从交付目录选择 trial.csv，点击“上传并解析”，按 T03 选择列和单位生成配对。
3. 按 T04 运行一次拟合，添加误差列；按 T05 添加系列和中文标题。
4. 按 T06 下载并打开 SVG 和三档 PNG，确认是否能用于自己的文档；记录图例缺失是否影响使用。
5. 按 T07 保存项目，刷新并重新导入同一 trial.csv、点击“上传并解析”；先选 X=x、Y=y 并生成成功配对，确认项目区域显示且操作空闲，再点“打开项目”选择保存的项目文件；检查是否恢复了设置和分析。
6. 若任何步骤找不到入口、看不懂文案或失败，停止猜测，按下面模板记录。首次无需开发者帮助的完成情况只有真实试用后才能填写；本轮为“待执行”。

反馈问题：哪一步需要求助？哪些中文错误/单位/统计含义不清楚？下载是否实际落盘且可打开？重开项目是否符合预期？缺少什么会阻止继续使用？不得索取真实研究数据；反馈只附合成样例。

### 失败与反馈记录模板

```text
执行人 / 日期时区：
浏览器完整版本 / OS版本 / 屏幕尺寸与缩放：
分支与 commit SHA / 本机 URL / isSecureContext：
用例编号 / 合成文件名 / 前置状态：
逐步操作（含是否键盘操作）：
预期 / 实际 / 可重复次数（实际观察）：
页面中文错误 / 控制台错误 / HTTP 状态与端点：
截图或录像 / 下载文件名、字节数、图片尺寸与打开结果：
是否需要开发者帮助 / 未完成原因：
严重性 / 建议后续（不当作已修复）：
```

只提交合成输入与必要诊断，不附令牌、凭据、用户数据或未经清理的网络抓包。记录 PASS 需有可追溯证据；没有环境或未执行记受阻/待执行，不能填通过。


## 迭代 #21：Firefox headless 实际执行记录

- 执行时间：2026-10-22 22:40–22:42 Asia/Shanghai；执行者：LabFlow Codex Dev（Selenium 自动化，非人工试用）。
- 基线：`iter/21` / `cb18d41b47b9ec84a1e165519ce37358ff57ad12`；本轮只修改三份获准文档，无产品代码、依赖、CI 或配置变更。
- 环境：真实 Mozilla Firefox **158.0.1**，buildID `20261019185856`；geckodriver **0.37.1**；Selenium **4.51.0**；macOS **27.0.1 (26A434)**。OS 取 `sw_vers`；WebDriver 的平台版本为 27.0.0，UA 的 macOS 10.15 为兼容字符串，不作为 OS 版本。
- 方式：宿主提供的 `http://127.0.0.1:4444` WebDriver，`webdriver.Remote` + `-headless`，外窗 1440×1000（截图内容区域 1440×915）；访问 `http://127.0.0.1:5173/`，本机后端 8000。`isSecureContext=true`、`crypto.subtle` 可用。没有 Browser 插件；没有使用 Playwright 引擎冒充品牌浏览器。
- 前置环境失败：此前沙箱内本地启动退出 134，未进入用例；本轮切换获提供的宿主 Remote 后恢复。Remote 与应用共享文件系统，文件选择使用 Selenium `UselessFileDetector` 传实际本机路径，未使用 geckodriver 不支持的 `/se/file` 上传扩展。系列名称用全选替换默认值；两次脚本准备失败不记为产品 FAIL。
- 证据：[MAC-100 修复后合成数据证据包](/api/attachments/0cfdbd50-a2ce-44b6-a377-a564054faf8a/content?download=1)，SHA-256 `e256156cada09c7d0b6549930816898c40a05af9e708b69e4cff508252d30b1a`。这是 Paperclip 任务附件地址（在 GitHub 查看文档时请从 MAC-100 打开附件）。包内含合成输入、实际下载、截图、逐步页面文本/请求响应、临时执行脚本、数值断言脚本与 `manifest.json` 文件校验表；临时根目录 `/tmp/labflow-browser/evidence/iter21`，证据不入 Git。

| 用例 | 本轮结果 | 观察及包内证据 |
|---|---|---|
| T01 | PASS（自动化） | 示例 GET 后 CSV POST 200、12 行；trial.csv 与 trial.xlsx 各 6 行，解析响应相同、数值列相同、中文缺失警告可见。`T01-sample/csv/xlsx.{json,txt,png}` |
| T02 | PASS（自动化） | y：n=5、missing=1、mean=5、std=√10、SEM=√2；页面显示舍入。bad.csv POST 422，中文“第 2 行有 3 个字段，但表头有 2 个”；重导恢复。`T02-stats/error.*` |
| T03 | PASS（自动化） | x/y、s/m 配对 POST 200，5 点、跳过 1 行；轴/单位可见，没有补零。`T03-pair.*` |
| T04/T04b | PASS（自动化） | 一次 y=2x+1、R²=1；sigma=0.5 加权含误差棒与 χ²；二/三次均 200、R²=1。非正 sigma POST 422 中文拒绝，重导后加权一次恢复。`T04-*`、`T04b-*` |
| T05 | PASS（自动化） | 四系列、23 点，中文系列二/三/四与不同形状/颜色；第五个按钮 disabled，移除系列四再加回。标题/网格/刻度/字号设置不触发请求；补充比较 SVG 点/路径/多边形几何未变。`T05-limit/style/geometry.*`、T07 保存配置 |
| T06 | PASS（自动化及截图复核） | 实际下载并以 file URL 在 Firefox 打开 SVG 与三档 PNG；解码 naturalWidth/Height 及文件非空核验，逐张截图可见白底、中文、单位、四种点形、曲线、误差棒与网格；HTML 图例未导出（已知限制）。`T06-download.*`、`T06-open-0..3.{json,png}`、`downloads/` |
| T07 | PASS（自动化） | 实际保存 v2、刷新重导/先配对再打开，恢复合成试用/仅合成数据、s/m、三个追加系列顺序、加权一次、中文样式、3×。打开后的请求为 series ×4 → fit ×1，全部 200，无项目上传端点。JSON 顶层仅严格配置与指纹字段，无原始行/拟合结果。`T07-saved/reopened.*` |
| T08 | PASS（自动化） | v1 恢复空名称/备注、2×，实际保存为 v2；篡改 SHA 与 changed.csv 对原 v2 均中文指纹拒绝，新请求为空。额外在恢复的分析中验证篡改拒绝前后 SVG/元数据/倍率完全相同。`T08-v1/migrated/fingerprint-rejected/changed-rejected/rejection-state.*` |

| 实际下载文件 | 字节数 | 解码尺寸 |
|---|---|---|
| labflow-中文试用图.svg | 18437 | 640×360 |
| labflow-中文试用图.png（1×） | 22522 | 640×360 |
| labflow-中文试用图(1).png（2×） | 50048 | 1280×720 |
| labflow-中文试用图(2).png（3×） | 79295 | 1920×1080 |

浏览器为同名文件添加 `(1)/(2)`；应用文件名保留中文、无路径字符。下载使用明确指定的本机证据目录，真实落盘后逐个打开，并非只读成功提示。项目文件为 `labflow-trial.labflow.json`，迁移重存为 `labflow-trial.labflow(1).json`。

页面标题与 URL 正确、非空，无 Vite 错误覆盖层；注入的 `error/unhandledrejection` 记录为空。这只覆盖页面运行时异常，不等于完整浏览器控制台、可访问性或响应式审计。首页“后端校验错误文案中文化”仍列为剩余工作及“导出数据”措辞已有静态记录，本轮不修产品文案。

边界：T09/T10 未执行；Chrome、Safari 未实测；Firefox 有头人工测试、三浏览器人工矩阵、外部用户验收未完成。没有证明所有浏览器立即回收 object URL 均可靠，也未测超时/离线失败路径。下一轮由 Lead 选择补齐这些范围；本轮不标 Phase 4 MVP 完成。

- QA 修复：旧附件 `cedead60-5b9c-426e-9daf-9039670c273f`（SHA-256 `833fc9d358ddbeb7ddba3e125011864a66669b63890db28423b4b6ec9e7606c5`）明确作废。新附件 [MAC-100 闭合证据包](/api/attachments/0cfdbd50-a2ce-44b6-a377-a564054faf8a/content?download=1)，SHA-256 `e256156cada09c7d0b6549930816898c40a05af9e708b69e4cff508252d30b1a`；上传后重新下载核验，102 个载荷文件的存在性、字节数和 SHA-256 全部一致，manifest 自身不列入校验表。路径相对 `iter21/manifest.json` 所在目录，`../scripts/` 和 `../iter21-*.log` 指向包内同级脚本及日志；删除原清单中 4 条不存在记录，补入原包中 5 个未列脚本/日志，不补造失败证据。
- 署名处理：旧提交 `2c8cf5c`、`b94d698` 原样保留；新增中文修复提交，最终 HEAD 正文末尾包含 `Co-Authored-By: Paperclip <noreply@paperclip.ing>`，不重写历史、不 force push。若 QA 要求修改旧提交署名，须升级给 Lead/用户决定。
- 最终交付：[iter/21 最终 HEAD](https://github.com/CubicZnS/labflow/commits/iter/21)；实际推送时间、不可变最终 SHA 与 GitHub commit 链接在 MAC-100 和 MAC-99 交付评论记录（提交内无法自引用自身 SHA）。本次仅文档/附件修复，运行 `git diff --check`、附件闭合校验、远端 SHA 与 GitHub API 核验；产品门禁沿用上轮记录，未重跑。交回 QA 复验，不宣布 PASS、不合并。

- QA 清单与署名修复提交：[720f425c44beb2613afffda063dbfab94532692a](https://github.com/CubicZnS/labflow/commit/720f425c44beb2613afffda063dbfab94532692a)；推送时间：2026-10-22 23:01:07 Asia/Shanghai。
