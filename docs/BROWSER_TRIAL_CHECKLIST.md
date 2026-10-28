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

迭代 #21 当时边界：T09/T10 未执行（T10 后续见 #22）；Chrome、Safari 未实测；Firefox 有头人工测试、三浏览器人工矩阵、外部用户验收未完成。没有证明所有浏览器立即回收 object URL 均可靠，也未测超时/离线失败路径。下一轮由 Lead 选择补齐这些范围；本轮不标 Phase 4 MVP 完成。

- QA 修复：旧附件 `cedead60-5b9c-426e-9daf-9039670c273f`（SHA-256 `833fc9d358ddbeb7ddba3e125011864a66669b63890db28423b4b6ec9e7606c5`）明确作废。新附件 [MAC-100 闭合证据包](/api/attachments/0cfdbd50-a2ce-44b6-a377-a564054faf8a/content?download=1)，SHA-256 `e256156cada09c7d0b6549930816898c40a05af9e708b69e4cff508252d30b1a`；上传后重新下载核验，102 个载荷文件的存在性、字节数和 SHA-256 全部一致，manifest 自身不列入校验表。路径相对 `iter21/manifest.json` 所在目录，`../scripts/` 和 `../iter21-*.log` 指向包内同级脚本及日志；删除原清单中 4 条不存在记录，补入原包中 5 个未列脚本/日志，不补造失败证据。
- 署名处理：旧提交 `2c8cf5c`、`b94d698` 原样保留；新增中文修复提交，最终 HEAD 正文末尾包含 `Co-Authored-By: Paperclip <noreply@paperclip.ing>`，不重写历史、不 force push。若 QA 要求修改旧提交署名，须升级给 Lead/用户决定。
- 最终交付：[iter/21 最终 HEAD](https://github.com/CubicZnS/labflow/commits/iter/21)；实际推送时间、不可变最终 SHA 与 GitHub commit 链接在 MAC-100 和 MAC-99 交付评论记录（提交内无法自引用自身 SHA）。本次仅文档/附件修复，运行 `git diff --check`、附件闭合校验、远端 SHA 与 GitHub API 核验；产品门禁沿用上轮记录，未重跑。交回 QA 复验，不宣布 PASS、不合并。

- QA 清单与署名修复提交：[720f425c44beb2613afffda063dbfab94532692a](https://github.com/CubicZnS/labflow/commit/720f425c44beb2613afffda063dbfab94532692a)；推送时间：2026-10-22 23:01:07 Asia/Shanghai。

## 迭代 #22：T10 离线失败与重试恢复实测

- 目标路径：首页健康连接 → 停止本轮后端 → 刷新/重试/上传失败 → 恢复后端 → 健康重试 → 重导合成 CSV、配对、拟合 → 单独阻断示例 GET → 保留结果 → 解除后重试。
- 环境：2026-10-23 00:03–00:04 Asia/Shanghai；Mozilla Firefox 158.0.1，buildID 20261019185856；macOS 27.0.1 (26A434)；geckodriver 0.37.1、Selenium 4.51.0；Remote headless + WebDriver BiDi，1440×1000 外窗、1440×915 内容区域，非人工试用。Browser plugin not available，沿用宿主真实 Firefox，不安装浏览器依赖或付费服务。
- URL http://127.0.0.1:5174/，标题“LabFlow · 科研数据分析”，页面非空；截图无 Vite 覆盖层。临时启动器从 frontend 工作目录运行，使用原 Vite 配置并在进程内覆盖代理至8001，不改仓库配置。已有8000/5173进程未停止。本轮仅停止自行创建的8001进程；前端始终运行至流程结束。首次临时启动目录错误造成 Tailwind 缺样式，纠正后全流程重跑，当前证据为重跑；属测试准备问题，无产品修复。

| 逐项检查 | 实际观察 | 证据 |
|---|---|---|
| 停后端、刷新 | 8001直接探测 Errno 61 Connection refused；Vite 代理返回500；API 未连接及中文启动提示 | network-actions.json、frontend.log、T10-refreshed-offline.* |
| 重试中及失败 | BiDi 只暂挂健康 GET 以观察“正在检查 API”和 disabled；释放后真实500，恢复可点；没有假成功 | T10-checking-controlled-pending.*、T10-retry-failed.* |
| 离线上传 | CSV POST500，中文上传失败；无列选择/配对入口，不能继续配对 | T10-upload-failed.* |
| 后端恢复 | 健康200、提示消失；CSV200六行，配对200五点/跳过一行，拟合200，y=2x+1、R²=1，数值容差1e-10 | T10-analysis-recovered.*、verify.py/log |
| 仅示例GET阻断 | BiDi failRequest 精确匹配 /samples/labflow-demo.csv；中文网络失败，未触发解析POST；项目区文本与所有SVG前后相同 | T10-sample-blocked.*、assertions.json、network-actions.json |
| 解除阻断重试 | 移除拦截后示例GET200、CSV POST200，失败提示消失 | T10-sample-recovered.* |

[MAC-104 证据 ZIP](/api/attachments/3519ad83-07ce-4460-961f-8d5247366912/content?download=1)，附件 ID `3519ad83-07ce-4460-961f-8d5247366912`，1,550,249 字节，SHA-256 `e63f1e50accf6d9f933030982a81a7ff7f8be4d6cb6c39706c9e8fe2e1c33fa1`。上传后已回下载：ZIP 哈希一致，manifest 的 48 项路径、字节数与 SHA256 逐项通过，ZIP 无额外未列载荷（manifest 自身不自引用）。

证据中页面 error/unhandledrejection 数组为空，仅是运行时异常监听，不代表完整浏览器控制台审计；预期网络500/阻断已单独记录。此次为 T10 单浏览器自动化实测断言通过，独立 Lead/QA 尚待审查，不宣称产品 QA PASS。没有实现或验证请求超时、无限 pending 的自动恢复、离线分析。T09、Chrome/Safari、Firefox 有头人工矩阵与外部验收仍未完成，Phase 4 MVP 尚未完成。


## 迭代 #23：T09 键盘与布局实测（未通过）

- 执行：2026-10-23 01:02–01:09 Asia/Shanghai；分支 `iter/23`，核对完整基线 [b3271f739e87e4b1764a462544fab90e01215f0b](https://github.com/CubicZnS/labflow/commit/b3271f739e87e4b1764a462544fab90e01215f0b)。真实 Mozilla Firefox **158.0.1 / buildID 20261019185856**；geckodriver **0.37.1**（300705c65d1b）、Selenium **4.51.0**；macOS **27.0.1 (26A434)**，WebDriver平台27.0.0与UA兼容字符串不替代OS版本。
- Browser plugin not available；使用已提供宿主 Remote `http://127.0.0.1:4444`，`-headless` + BiDi；页面 `http://127.0.0.1:5173/`，后端8000。未启动/停止他人服务，未修改产品、配置、权限或依赖。URL/标题“LabFlow · 科研数据分析”正确、页面非空，截图无框架覆盖层；error/unhandledrejection为空，仅此范围，不声称完整控制台审计。

| 子项 | 实际结果与证据（不是人工验收） |
|---|---|
| 刷新/跳转链接 | PASS（自动化）：首次 Tab“跳到主要内容”，Enter 焦点进入 `#import` SECTION、3px青色outline；`keyboard-final/01-skip-focus.*`、`02-skip-target.*` |
| CSV/配对/方向键 | 注入合成trial.csv后Space上传200、6行；键盘x/y选择及Enter配对200、5点跳过1行。方向键未完成拟合次数2选择（实际仍1），脚本明确记录Select非键盘回退，不能记纯键盘PASS |
| 拟合/保存键盘 | 未通过：Space“运行拟合”无fit请求；正向Tab反复在下部控件/仓库链接之间，Shift+Tab能回保存；保存Enter后20秒无文件。`keyboard-final/focus-sequence.json`、requests.json、run.log在上级keyboard-final.log。未确认是产品还是Remote键盘分派/焦点问题；不能宣称绝对陷阱或全程焦点清晰。多数取样:focus-visible=false，保留原始结果 |
| 项目/下载补充 | **点击建立状态，非纯键盘PASS**：CSV→配对→fit各200；保存v2、注入文件打开后series/fit200；SVG7208字节640×360、PNG32001字节1280×720（2×），实际落盘、Firefox file URL解码截图。`supplement/requests.json`、results.json、downloads/、svg-opened.png、png-opened.png。原生文件选择器键盘人工验收未执行 |
| 忙时禁用 | BiDi只暂挂本轮fit最多8秒观察后释放；打开项目及fit选择/运行disabled，保存、SVG/PNG、主列、追加系列仍enabled。精确清单在supplement/results.json，截图fit-controlled-busy.png。没有假称全部按钮禁用；是否属于冲突由Lead收敛后续范围 |
| 320 CSS px | **FAIL**：外窗请求320实际最小500，supplement/width-320-*是500，不冒充320；随后BiDi `browsingContext.setViewport`设置真实内容320×915，outerWidth1440、DPR1、scrollWidth773。45步Tab有32个有效尺寸控件中心hit-test失败，输入/配对/导出裁切。`viewport320/traversal.json`、bidi-320-focus-*.png。长表以外页面也横向溢出 |
| 768 / 1280 CSS px | innerWidth分别768/1280、innerHeight915、DPR1，scrollWidth分别768/1280。各50步Tab+12步ShiftTab，768有1次中心hit失败：chart-title-input x108/y−9.5/w601.23/h38，顶部栏遮挡待复核；1280为0。仅几何取样，不证明全部控件无陷阱/遮挡；supplement/traversal-*.json、width-*-focus-*.png |
| 200%真实缩放 | **未执行**：Remote Command+'+'后innerWidth1280/DPR1均未变，无200%证据；CSS zoom始终1。未使用CSS zoom冒充或修改宿主配置获取特权；supplement/results.json、zoom-attempt.* |
| 减少动态效果 | Firefox会话偏好ui.prefersReducedMotion=1，matchMedia=true、html scrollBehavior=auto；截图状态JSON。非OS设置界面或有头人工验收 |

精确复现：合成CSV上传→X=x/Y=y配对→一次拟合→Firefox BiDi内容视口320×915→Tab到项目/导出控件；页面宽773，PNG按钮等位于可见宽度之外。截图支持横向裁切，不证明所有裁切控件绝对无法经页面横滚访问。768遮挡取样及Remote键盘激活失败保持待复核；本轮只报告，不修产品。准备失败（下拉框未确认、跳转目标假设错误、文件框send_keys(Tab)被当路径、并发Remote新会话被拒）均保留在ZIP，不能算产品FAIL或新PASS；最终结论以keyboard-final、supplement和viewport320各自声明方式为准。

[本任务证据 ZIP](/api/attachments/c13f5aab-b62b-4772-84d5-54ddb3af8934/content?download=1)，附件 `c13f5aab-b62b-4772-84d5-54ddb3af8934`，7,722,033字节，SHA-256 `8a324632c55ef6e100cc827a32bc30903df4e5ba9f3dfc26cff4e7475acec99b`。上传后回下载ZIP哈希一致；manifest.json的292个载荷路径/大小/SHA256全部核验，集合闭合、无额外文件，manifest自身不自引用。包内说明.md区分尝试与最终证据，全部输入为合成数据。上传helper因系统临时目录不可写未发出上传请求，改用技能文档规定的附件API与明确可写临时文件，未修改权限。

命令：临时脚本 `/tmp/labflow-browser/venv/bin/python /tmp/labflow-browser/evidence/iter23/{keyboard-final,supplement,viewport320}.py`（分别执行，不用花括号当单个脚本）；完整脚本/日志在ZIP。keyboard-final退出1（保存超时）；supplement和viewport320退出0。backend工作目录`.venv/bin/python -m pytest -q`退出0，157项（72+72+13），Starlette/httpx弃用、NumPy RankWarning；`.venv/bin/ruff check app tests`退出0。frontend指定pnpm typecheck、test:run（6文件174项，React key警告）、build（36模块）均退出0，*.exit/log保留原始状态及输出。未新增镜像测试；提交前另运行git diff --check。

T09整体未通过；只是自动化证据交付，非屏幕阅读器审计、非Firefox有头人工矩阵、非三浏览器或外部用户验收。200%仍缺，Phase4 MVP未完成。下一轮由Lead选择320px溢出修复及键盘/焦点问题复核的最小范围，本轮不擅自开轮、合并或创建QA。


## 迭代 #24：修复320px页面溢出

- 分支 `iter/24`，已存在基线 [e3140656a5dd168074bdb1980e745caebd58a671](https://github.com/CubicZnS/labflow/commit/e3140656a5dd168074bdb1980e745caebd58a671)。最终不可变提交与实际推送时间将在提交后的任务交付记录，不能在自身提交内虚构自引用。
- 环境：2026-10-23 01:59–02:04 Asia/Shanghai；macOS 27.0.1 (26A434)，Firefox158.0.1 / buildID20261019185856、geckodriver0.37.1、Selenium4.51.0，headless Remote4444 + BiDi；页面5173、后端8000，未启停共享服务。BiDi直接设内容视口320/768/1280×915、DPR1，未使用CSS zoom。Browser plugin not available，沿用宿主真实浏览器。
- 根因证据：`before/320-metrics.json` 中导入卡片min-width:auto、宽753.22，右边缘773.22；未声明单列轨道的Grid被长表/子控件的最小内容宽撑开。修复后曾剩329px，进一步测得拟合结果长RMSE/最大残差字符串溢出其94px内容区。最小修改只在CsvImportPanel与FitPanel：显式可收缩单列/大屏轨道和卡片min-w-0；拟合单列轨道及长数值换行。没有页面overflow-x:hidden，没有改计算/导出/快照逻辑。

| 内容视口 | 修复前页面scrollWidth | 修复后页面scrollWidth / clientWidth |
|---|---|---|
| 320×915 | 773 | 320 / 320 |
| 768×915 | 785 | 768 / 768 |
| 1280×915 | 1280 | 1280 / 1280 |

本轮768为BiDi精确内容视口，复现前宽785；上轮768外窗模式未观察到此值，不覆盖旧证据。前后同合成CSV上传→X=x/Y=y→拟合场景；修复后每档先设真实内容视口、刷新并重新完成上传/配对/拟合。`after/*-controls.json`验证所有可见按钮/输入/选择/文本域水平边界位于视口，截图包括导入、配对、拟合、项目及导出；实际点击上传/配对/拟合、保存、SVG/PNG，项目打开使用文件注入。`*-tables.json`实测表格父容器可横滚，320下scrollLeft>0。拟合5点、斜率2/截距1（1e-10容差），保存快照schemaVersion=2、重开重跑成功，SVG viewBox640×360、PNG头尺寸1280×720。图表仍随容器缩放，导出不受页面宽度影响；既有174项前端测试保护其他契约。

复跑：解压证据后，将`run24.py`放入`/tmp/labflow-browser/`，在仓库根目录运行 `/tmp/labflow-browser/venv/bin/python /tmp/labflow-browser/run24.py after`。需要已有真实Firefox/Remote4444、5173/8000和Selenium环境；脚本会创建独立会话并退出，不改仓库配置或依赖。断言页面宽度、可见控件边界、表内滚动、拟合数值/快照/导出尺寸；退回旧布局会触发页面宽度或控件边界失败，非CSS/JSDOM镜像断言。`before-run.py`保存修复前采集脚本；`before/`与`after/`含前后截图及容器测量，`after.log`三档通过。

- 门禁：backend指定python pytest退出0（157项），ruff退出0；frontend指定pnpm typecheck、test:run（6文件174项）、build均退出0。完整输出/退出码在checks/，保留既有Starlette/httpx弃用、NumPy RankWarning、React key警告；git diff --check通过。未添加JSDOM布局断言，浏览器回归脚本作为附件交付。
- 证据：[迭代 #24 证据 ZIP](/api/attachments/fb4bdda8-31e8-43ae-bc27-7b5dc539724d/content?download=1)，3,870,126字节，SHA256 `4ff2893012e6ef51ecdfecd04395c8e4c17e8d4397e8791eb8490cee3c1adf3c`；上传后回下载ZIP哈希一致，manifest98项路径/大小/SHA256逐项核对、无遗漏/额外载荷、自身不自引用。artifact工作产品`ec68519a-1702-419e-bce4-47edfdffc577`。helper因宿主系统临时目录不可写未发出请求，按技能规定附件API上传，无权限修改。
- 边界：仅Firefox headless自动化，文件为合成注入，非原生选择器或有头人工验收；键盘激活、焦点遮挡、200%缩放未纳入本轮，Chrome/Safari/屏幕阅读器/人工矩阵/外部验收仍待执行。error监听不代表完整控制台审计。T09整体、Phase4 MVP未完成；Lead独立审查后另建QA，PASS后才合并。本轮只推iter/24、不创建QA、不改父任务。


## 迭代 #25：纯键盘路径复核（验证FAIL）

- 分支 `iter/25`，已存在基线 [f01c5c5918aeaa78926648830009a3e9f161b50e](https://github.com/CubicZnS/labflow/commit/f01c5c5918aeaa78926648830009a3e9f161b50e)。只更新四份获准文档，不改产品、依赖、配置或 CI。最终真实提交与推送时间见[本任务交付](/MAC/issues/MAC-119)，不虚构提交内自引用。
- 环境：2026-10-23 04:02–04:05 Asia/Shanghai；macOS27.0.1(26A434)、Firefox158.0.1/build20261019185856、geckodriver0.37.1、Selenium4.51.0。宿主 Remote4444 + BiDi headless，页面5173/后端8000，内容视口1280×915、DPR1、安全上下文。Browser plugin not available，按任务指定用既有 Selenium；未启停共享服务、改权限或安装依赖。页面标题/URL正确、非空、无Vite错误覆盖层；运行时error/unhandledrejection为空，仅此监听范围，不声称完整控制台审计。

| 路径 | 真实结果与证据 |
|---|---|
| 独立校准1/2 | 普通非React HTML：Tab和字符输入有效，ArrowDown/Enter可信事件已到select但1未改2；加入Space后仍1。attempt1/attempt2保留脚本、事件、截图和失败日志，退出1 |
| 校准对照 | Actions与元素send_keys均未改变select；普通button的Space/Enter各触发可信click一次，Shift+Tab返回select。不是产品缺陷证据，未定位Firefox/macOS/Remote内部根因 |
| 严格产品路径 | 首Tab跳转链接、Enter进入导入区；合成文件注入后Space上传200，6行。方向键后X/Y均x，生成配对按钮禁用，90步遍历不可达禁用按钮，脚本退出1。无series/fit请求、无项目下载；不称焦点陷阱。attempt3/final-requests.json、steps.json及failure.png |
| BiDi补充（超出限定按键，不记严格PASS） | 直接input.performActions加字符y选中Y后，Enter配对200六点；拟合次数Home/ArrowDown/Enter后仍1。Space运行fit200，真实FormData degree=1，非2；Shift+Tab到保存、Enter实际落盘669字节v2。根目录steps.json、final-requests.json、02-paired/03-degree2/04-fitted/05-save-focused/06-saved截图与JSON。03-degree2文件名是尝试目标，JSON明确实际1。最终degree2请求断言失败，退出1 |
| 项目实际内容 | downloads/labflow-trial.labflow.json，schemaVersion2、sourceFileName trial.csv、31字节数据SHA256指纹、6行、x/y列、空元数据/单位/追加系列、fit.degree1、标准图表样式、pngScale2；不含原始行或拟合结果。saved-content.json保留解析内容；不是二次拟合项目 |

结论：规定的方向键选择二次拟合并请求degree=2路径 **FAIL**；后续运行/下载仅有明确标记的补充证据。Remote中存在可工作的按钮键盘激活/返回保存路径，不能把#23的无fit/无下载直接判成产品缺陷，也不能反推#23全部失败只有单一原因。下拉框默认选值问题在独立普通HTML复现，产品归因未成立；交Lead收敛后续验证，不修产品。严格路径未完成不冒报PASS；T09整体与Phase4 MVP未完成。

证据：[本轮ZIP](/api/attachments/c79493c0-9ed4-4446-a58f-2488fc3213a6/content?download=1)，附件ID `c79493c0-9ed4-4446-a58f-2488fc3213a6`，1,451,970字节，SHA256 `eed8734eba61768f942fdc01cac9437356715c3027ff63bfebbfa945ad5cecf5`。上传后已回下载，ZIP字节/哈希及manifest87个载荷路径/字节/SHA256逐项一致、集合闭合，manifest自身不自引用。helper临时目录被拒，未发出请求；改用规定附件API与可写/tmp文件，未改权限。ZIP说明.md区分四次执行与超范围字符补充；失败堆栈在run.log，failure.txt为页面正文。

复跑：整个iter25目录放回`/tmp/labflow-browser/evidence/iter25`，运行 `/tmp/labflow-browser/venv/bin/python /tmp/labflow-browser/evidence/iter25/run25.py`，前提已有Remote4444、5173/8000和Selenium，不安装或启动服务；预期当前环境degree2断言退出1。同名下载由浏览器自动编号，脚本只认本次新增文件。attempt1/2/3目录中的脚本分别为当时快照。注入监听/读取状态不改变焦点或值，产品操作无click、JS focus、Select API。合成文件注入不是原生文件选择器人工验收。焦点遮挡、200%缩放、其他浏览器、屏幕阅读器、人工矩阵、外部验收均未纳入本轮。

门禁：backend指定python pytest退出0（157项），ruff退出0；frontend指定pnpm typecheck、test:run（6文件174项）、build退出0，原始输出与退出码在checks/。既有Starlette/httpx弃用、NumPy RankWarning、React key警告保留。提交前git diff --check通过；只推iter/25，Lead独立审查后另建QA，本轮不创建QA、不合并、不写父任务。


## 迭代 #26：键盘焦点与顶部栏稳定遮挡（验证FAIL）

本轮只复核 #23 的取样，不修产品。分支按人工答复 `1896c157-f2d2-45b9-8f1d-14bf0257481c` 保留 `MAC-123-26` 并推送同名远端；不再要求 `iter/26`，未操作主工作区或启停服务。隔离 workspace `28aa2e40-d011-4577-b979-d22124bc31e6`，strategyType=`git_worktree`，baseRef=`origin/dev`，基线 [c5b61e7280d9fc7fe8e6f291e3d86c0b4e932c05](https://github.com/CubicZnS/labflow/commit/c5b61e7280d9fc7fe8e6f291e3d86c0b4e932c05)。路径为 `/Users/zhangzimo/Library/Application Support/PaperclipHost/worktrees/labflow/MAC-123-26`。复核前 backend `/api/health` 与 frontend 均 HTTP 200。

环境：2026-10-24 Asia/Shanghai，macOS 27.0.1 (26A434)，Firefox 158.0.1 / buildID 20261019185856，geckodriver 0.37.1，Selenium 4.51.0；既有 Remote4444 + BiDi headless，页面 `http://127.0.0.1:5173/`、API8000。BiDi 设置实际内容视口 768/1280×915，DPR1，不以外窗或 CSS zoom 冒充。Browser plugin not available；`pnpm exec playwright --version` 退出1，`Command "playwright" not found`，沿用既有 Selenium，不安装依赖。完整能力、OS版本、时间、真实视口见 environment.json/context.json。

方法与证据解释：

- 合成 CSV 为5点 `y=2x+1`，文件注入、点击与 Select 仅用于准备导入/配对/拟合；实际 csv/series/fit 请求均200。待测焦点由 BiDi 可信 Tab/Shift+Tab 按键产生，未调用 JS focus、scrollIntoView、scrollTo。准备过程不是纯键盘 PASS。
- 首轮 186 次按键：每步读取即时、计划120/350/700/950ms的 activeElement、rect、scrollY、顶部栏边界、中心命中、视口可见面积与5×5网格命中。Remote往返使实际间隔略大，samples.elapsed保留实际值。最后两次几何/scrollY差异<0.5 CSS px才记稳定，否则250ms延长至3秒；不删除即时样本。“即时”是按键命令返回后的首读，无法观察命令执行期间或首读之前的瞬态；结论仅针对后续稳定窗口。首轮部分样本 `:focus-visible=false`，不能单凭它断言完整焦点视觉表现。
- 因此另做原生 `browsingContext.activate`/WebDriver窗口选择，非 JS 聚焦；两档从拟合按钮逆向11次按键到标题，`document.hasFocus()`、`:focus`、`:focus-visible` 均true，位置至约1秒仍不变。active-full 仅在准备后激活一次，记录到Tab越过页尾进入浏览器界面后窗口再次失焦，不能将全程当作真实焦点视觉证据。随后 native-cycle 在每步之前检测窗口失焦，仅在此浏览器界面边界原生重新激活页面（不调用JS focus），保留before与nativeContextReactivated；双向循环取样为即时/350/700ms，稳定判据相同。
- 顶部栏内链接与顶部栏的几何交集不是遮挡。原始 uncoveredRatio 仅为视口面积减顶部栏矩形交集；不得直接将 failures.json 的几何候选数量当产品缺陷数。隐藏的1px文件输入也不能作为关键可见控件裁切。真实可见性结合中心/网格命中、元素所在层和截图判断；网格比例是离散采样，不冒充精确面积。

| 标题输入框路径 | 稳定顶部 y / 中心 y | 视口内比例 | 顶部栏边界 | 实际命中与结论 |
|---|---|---|---|---|
| 768×915 正向 Tab | 438.5 / 457.5 | 100% | y=0…65 | 中心自身、25/25网格命中；仅该取样可见 |
| 1280×915 正向 Tab | 733.5 / 752.5 | 100% | y=0…65 | 中心自身、25/25网格命中；仅该取样可见 |
| 768×915 反向 Shift+Tab | −9.5 / 9.5 | 75% | y=0…65 | 中心命中header内DIV、0/25；剩余28.5px全处于顶部栏下，无遮挡可交互区域0，FAIL |
| 1280×915 反向 Shift+Tab | −9.5 / 9.5 | 75% | y=0…65 | 中心命中header内DIV、0/25；无遮挡可交互区域0，FAIL |

上表正向值来自首轮，反向值同时由窗口激活补充复现。原始 #23 `supplement/traversal-768.json` 的 −9.5 实为矩形顶边，height=38，因此中心9.5；先前“中心−9.5”的描述应纠正。#26宽度为552/486.4，与#23旧布局宽601.23不同，不伪称完全相同布局。顶部栏半透明可透出文字，不代表输入框未被命中层遮挡。窗口激活补充两档均在0…约1.1秒保持顶边−9.5、中心9.5，不是本次可观察窗口内的滚动瞬态。

最小复现：使用上述环境和任一目标视口 → 注入trial.csv并点击“上传并解析” → 点击选择X=x、Y=y → 点击“生成配对数据” → 点击“运行拟合”，等待成功 → 原生激活浏览器上下文 → 11次 Shift+Tab（每步稳定等待），直到 data-testid=chart-title-input。保存 rect、header、elementFromPoint 与截图；此时真实焦点true但输入框可交互区域被遮挡。脚本 `activated/run26_activated.py` 可在原有4444/5173/8000服务下复跑；不启动服务、不修改产品。

最终native-cycle共182次按键；每档拟合后正向42次（41个页面保持焦点样本+1次浏览器界面边界）、反向40次（39个保持焦点样本+1次边界），每方向均有一次边界后原生激活。标题正向/反向样本的document.hasFocus/:focus/:focus-visible均true，稳定判据通过。遍历覆盖导入、X/Y配对、拟合、项目名称/备注/保存/打开、标题/样式、追加系列、SVG/PNG导出，以及可聚焦表格容器。每档双向遍历都能离开目标并到达页面/浏览器界面边界，原始顺序在各目录 states.json。原始脚本wrapped仅表示再次遇到已记录焦点身份；native-cycle反向离开页面后原生激活可能恢复到中途控件，不把这个重复误称完整页面绕回。边界原生激活单独记录，不能冒充完全不离开页面的连续纯键盘工作流；只证明该次 Remote路径未陷在局部控件中，不证明所有状态或原生文件对话框无陷阱。其他边缘裁切/隐藏文件输入候选留在原始数据，供Lead按范围审查，不擅自扩大产品修复。

页面标题/URL正确、正文非空，无Vite错误覆盖层；error/unhandledrejection数组为空，仅覆盖页面异常监听，不等于完整控制台审计。五项门禁退出0：后端pytest157项、Ruff；前端typecheck、6文件174项Vitest、build；既有弃用/RankWarning等见原始日志。git diff --check在文档提交前复核。浏览器可见性 **FAIL** 与代码门禁通过分别记录，均不称独立 QA PASS。

证据已上传并逐包回下载校验（单附件上限10 MB，分6包；包1为索引/原始数据/关键截图，其余保留全部候选截图）：

| 包 | 字节数 | SHA256 | manifest载荷数 |
|---|---:|---|---:|
| [ZIP 1](/api/attachments/69a6c282-9b2c-475e-b21b-f15923e80328/content?download=1) | 1273668 | `9a1638e848f8d0afb7e7a166a806cf261a0a3de7cfee5b7f910382cba4240155` | 91 |
| [ZIP 2](/api/attachments/5bd91d24-b0d5-47e9-9c96-1e7d6b066d79/content?download=1) | 7602238 | `7ea629e3b7d75ac30e7665c712e5709e7da6add805631e212c15e2d399a623b8` | 49 |
| [ZIP 3](/api/attachments/3bd597ab-5387-4ca2-a501-39bc9d0161ec/content?download=1) | 7448935 | `e3c4d03b6a3737a5aecfc18531cd78dc6df8a7653f9ac0dc722dcbf7d1dfeb94` | 53 |
| [ZIP 4](/api/attachments/1ddc6026-4c4d-4a1d-a700-b9633d4361a2/content?download=1) | 7574442 | `b41c1511e78d693328d7207d02d1f4fb0607c850e950ee456d051ea4e77f578f` | 56 |
| [ZIP 5](/api/attachments/b3ec5c4c-e260-431b-baa4-895c927e0e9d/content?download=1) | 7659474 | `66915a6cb61308da4fc126beab3a94069207116a846f99d85342d92f84b6dbb9` | 49 |
| [ZIP 6](/api/attachments/adb68531-a69b-4317-8137-6ee1e4e00062/content?download=1) | 1687322 | `fb5a523eb1ea8bbccfa599a98fde603b78f4729639bad1bc85fc5f0eba3eb554` | 14 |

六个ZIP字节数与SHA256均与本地一致；各ZIP路径集合严格等于manifest载荷+manifest自身，逐文件字节/哈希一致；包1 global-inventory.json列出的311个原始载荷在六包恰好各出现一次、无额外或缺失，另有索引自身（包1载荷总91项）。manifest自身不自引用。每个附件均已登记artifact工作产品。helper在临时目录创建时被沙箱拒绝、未发出请求；直接API对33,230,255字节单包返回422“Attachment is larger than the 10 MB limit”，随后拆包成功，未改权限或配置。

交回Lead独立审查稳定遮挡最小复现，后续由Lead另建QA/选择一个修复任务。#25方向键选择仍FAIL；真实200%缩放、Chrome/Safari、Firefox有头人工矩阵、屏幕阅读器与外部验收未执行，本轮不宣称整个T09或Phase4 MVP完成。


## 迭代 #27：顶部栏焦点遮挡最小修复

- 共享主工作区 `iter/27`，基线 [23f882a04c9ca8af10f321c2526d17070e8a4c8f](https://github.com/CubicZnS/labflow/commit/23f882a04c9ca8af10f321c2526d17070e8a4c8f)，2026-10-26 Asia/Shanghai。未启停共享服务；先阅读 Paperclip issue-workspaces，沿用已有 Remote4444、前端5173与后端8000。
- 环境：真实 Firefox 158.0.1 / buildID 20261019185856、geckodriver 0.37.1、Selenium4.51.0、macOS27.0.1(26A434)，headless + BiDi实际内容视口，DPR1；没有用CSS zoom或JSDOM代替布局。
- 根因：根滚动容器未为固定高度sticky顶部栏预留空间，原生键盘滚动可将控件放入顶部覆盖区。只在 `html` 设置顶部 `calc(4rem + 1px + 1rem)` 与底部 `1rem` scroll-padding，覆盖64px栏内容、1px边框和描边安全间距。保留平滑滚动/减少动态效果、导航及描边；无逐控件补丁或隐藏遮挡。若未来改顶部栏高度，应同步此间距。
- before/与after/同路径：合成5点CSV→点击/Select准备X=x/Y=y配对→一次拟合→原生激活上下文→11次可信Shift+Tab到标题。768/1280修复前稳定顶边−9.5、中心9.5、0/25内部命中，修复后顶边471、中心490、25/25命中。两档document.hasFocus/:focus/:focus-visible均true；修复后输入框及外延5px描边完整位于header底边65之下及915px视口内。即时及后续120/350/700/950ms实际elapsed、稳定判据与前后截图均保留。

| 回归内容视口 | 反向标题稳定顶边 | 内部命中 | 按键取样数（含首次11步） |
|---|---:|---:|---:|
| 320×915 | 290 | 25/25 | 99 |
| 768×915 | 471 | 25/25 | 99 |
| 1280×915 | 471 | 25/25 | 99 |

每档重新上传/配对/拟合，标题检查后正向44步、反向44步；每步即时/150/350/700ms取样，最后两次rect与scrollY差<0.5判稳定，否则延长至3秒。页面scrollWidth逐步等于320/768/1280，无新增水平溢出。遍历包含项目/图表/配对/拟合及导入等控件；原始顺序、可信keydown、窗口焦点和浏览器边界后的nativeReactivated记录见regression/steps.json及states.json。准备不是纯键盘，离开页面后原生激活不是连续绕回；隐藏1px文件输入与header内部几何交集候选不当作产品FAIL。

复跑：保持解压目录结构，已有上述服务与Selenium环境下运行 `/tmp/labflow-browser/venv/bin/python <解压目录>/regression/run27.py`，输出位于脚本目录。脚本断言真实标题焦点/描边安全边界、中心与25内部命中及页面宽度；不修改焦点/滚动来制造通过。before/after保存前后最小复现。一次并发Remote会话准备失败、一次320完成后日志打印KeyError保留在session-conflict.log与regression-attempt/，最终三档串行运行退出0；不作产品FAIL。

五项门禁均退出0：backend指定python pytest157项、ruff；frontend指定pnpm typecheck、test:run174项、build。既有弃用/RankWarning/React key警告见checks/；git diff --check通过。不添加伪布局JSDOM断言，回归脚本随附件交付；计算/快照/导出代码与契约未改变。

证据：[迭代27 ZIP](/api/attachments/2de170e5-0a5f-4918-9136-d261532a0e59/content?download=1)，附件 `2de170e5-0a5f-4918-9136-d261532a0e59`，5308301字节，SHA256 `a824f881fb30cec14c94ef1df39483683b3e11f768a080521c5e91f168898b71`。上传后回下载字节/ZIP哈希一致，manifest 72项路径/大小/SHA256逐项一致，路径集合闭合、无重复/额外文件，manifest自身不自引用。已登记artifact工作产品 `00ac1153-8699-43b8-aa5c-baa7c7e95db0`。证据仅合成CSV，无秘密或用户数据。

边界：仅Firefox headless自动化，无原生文件选择器/其他浏览器/屏幕阅读器/有头人工矩阵或外部验收；方向键选择与200%缩放不在本轮。待Lead独立审查后另建QA，本轮不自行宣称QA PASS；T09整体及Phase4 MVP仍未完成。

上传helper在创建宿主临时文件时被拒，curl因输出参数为空未发出请求；随后按技能规定附件API上传成功，未修改权限或配置。

注意：regression/failure.txt 与 exception.png 为首次320日志打印KeyError留下的文件；最终 run.log 三档完成及297步steps.json覆盖重跑结果，不把旧异常截图当最终运行失败。


## 迭代 #27：QA FAIL 后补齐全焦点与描边边界

2026-10-26 Asia/Shanghai；共享主工作区 `iter/27`，修复前候选 [1acfd300676f98fd8e1d4d5eecf5977fe82c3415](https://github.com/CubicZnS/labflow/commit/1acfd300676f98fd8e1d4d5eecf5977fe82c3415)。独立 QA [MAC-167](/MAC/issues/MAC-167) 确认标题修复通过，但原脚本只对标题作完整可见性断言、失败候选过滤漏掉原生可聚焦 DIV，清除按钮描边亦越入顶部栏1px；因此初版 QA FAIL。上节“297步通过”仅表示旧脚本标题/宽度断言通过，不能扩展为全节点5px安全间距通过。本节替代此类扩大解读，不删除旧证据。

环境仍为真实Firefox 158.0.1 / buildID 20261019185856、geckodriver 0.37.1、Selenium 4.51.0、macOS27.0.1(26A434)，headless Remote4444 + BiDi内容视口320/768/1280×915、DPR1。页面5173/后端8000已有服务，未启停。Browser plugin not available，Playwright命令未安装；依任务沿用既有真实Firefox/Selenium，不装依赖。标题、URL、非空正文、无Vite覆盖层及window error/unhandledrejection监听通过；此监听不等于完整console审计或人工验收。

**根因及最小修复**：Firefox原生焦点滚动可能保留部分已可见区域；仅scroll-padding不足以保证容器与完整描边可见。App只增加一个focusin监听，下一动画帧确认仍为当前:focus-visible节点后，按实际顶部栏高度、实际描边外延及8px余量作最小纵向校正，以当前scrollY加校正量的绝对scrollTo取消进行中的平滑滚动相对目标干扰；不接管按键，不改变焦点，不按控件分别加补丁，卸载清理监听与待执行帧。CSS全局`:root :focus:focus-visible`覆盖原生滚动DIV，并明确高于编译后排在后面的Tailwind focus:outline-none（旧输入框实际为透明2px描边/2px偏移，仍有控件focus ring，不宣称完全无提示）；现在统一青色3px/偏移2px。固定跳转链接top/left改8px，5px外描边留在视口内。保留原有根scroll-padding及reduce分支。超出安全视口高度的节点只能对齐顶部，未在本轮五点合成数据上宣称超大内容全框可见。

**先失败、后修复及基线对照**：red/在旧候选实际运行297步，原始几何断言记录11次失败；用最终统一判据复核原始样本（含透明描边及至少5px外延）为131次失败，不把同节点重复出现当作独立缺陷数。baseline/在改App之前运行：经git产品diff与源哈希确认#26到旧候选只增加根scroll-padding，在浏览器中将其归零作等效基线滚动样式对照，未切分支或创建worktree；207步、同一初始11步/正向前14步，反向44步。不是独立构建或发布归因，反向起点因正向步数不同不称完整路径完全相同。

- 768正向系数DIV：基线等效对照top801.5/bottom942.5、20/25命中；旧候选834/975、15/25，基线亦部分裁切。
- 320正向预览DIV：基线652/904，旧候选684.5/936.5，同一正向前缀在旧候选出现视口下沿裁切，不能笼统称全是新增或全是既有。
- 1280清除按钮：旧候选反向index38 top69，保守5px描边上沿64<header底65；基线等效反向index38 top36.5，起点差异单独说明。实际安全边界均需修复，不以标题通过作替代。
- 仅加scroll-margin的浏览器内探测未修复768 DIV（margin.*）。首轮统一校正几何已无失败，但描边选择器与Tailwind变体同优先级仍被覆盖，主动中断（attempt-specificity/与.log），提高选择器优先级后完整重跑。上述失败/中断均保留，不作最终PASS证据。

**最终严格回归**：以document.activeElement为准，不按标签名单过滤。所有纳入节点（包含原生滚动DIV）最后两次rect/scrollY变化<0.5 CSS px判稳定，保留按键返回后即时及150/350/700ms实际elapsed，不稳定延至3秒。逐节点assert真实document.hasFocus/:focus/:focus-visible、非透明描边、完整几何加至少5px外延位于安全视口、中心与25内部点命中自身/后代、页面无水平溢出；header内链接与z50跳转链接按其真实层级检查视口边界，不误算成被header遮挡。

| 内容视口 | 按键样本 / 纳入焦点 | 纳入原生DIV次数 | 清除按钮最小top | 失败 |
|---|---:|---:|---:|---:|
| 320×915 | 99 / 92 | 6 | 337.25 | 0 |
| 768×915 | 99 / 91 | 4 | 337.25 | 0 |
| 1280×915 | 99 / 91 | 4 | 78 | 0 |

最终green/共297步、274次纳入、0失败；23次排除只含既有1px/CSS裁剪的sr-only文件输入及document.hasFocus/:focus不同时为true的浏览器界面边界，逐项reason/几何存于exclusions.json，无DIV排除。所有原始取样的页面宽度均等于视口。标题修复仍通过，输入框/按钮/表格容器的边界及截图分别保留，不以25点命中代替外框/描边断言。

usability/另从标题用可信Shift+Tab回到跳转链接，再正向遍历至浏览器界面边界，224步、209次纳入，0失败；4次真实聚焦DIV经可信ArrowRight后scrollLeft增长、ArrowLeft可返回，滚前/后几何及命中仍通过，证明本次141px系数区、252px拟合预览等容器可聚焦/横滚/离开，不因“大容器”排除。没有使用方向键选择下拉值来扩展本轮目标。可信keydown、窗口边界原生activate、即时/稳定数据和截图完整保存。准备仍用点击/Select/合成文件注入，非原生文件选择器或全程纯键盘验收。

复跑：解压所有包到同一目录；已有服务和Selenium时，在共享仓库根运行 `/tmp/labflow-browser/venv/bin/python <证据目录>/run.py green`，再运行 `.../run.py usability`，输出写各阶段目录。浏览器脚本不调用JS focus/scrollTo制造通过；产品自身统一滚动校正即被测实现。red/baseline阶段只可在原App源上重跑，脚本有源哈希护栏，禁止在新校正上伪造基线；baseline-run.py/red-run.py保存当时脚本，audit.py以最终判据审核原始数据。

补充edges.py检查正常smooth的320/768/1280及reduce会话auto的768/1280，共5组：真实键盘激活跳转链接与header锚点、超高#import顶部安全可读、PageDown可阅读且不被反复拉回、Tab可离开后小控件完整可见。超高#import SECTION是有限排除：高度超过可用视口，320/768整宽区域也无法容纳外描边；不要求其整框/中心25点全可见，普通滚动DIV不适用此排除。记录即时至2秒稳定窗口与截图，不把会话reduce偏好当OS人工验收。相对scrollBy候选在此路径出现超大区域中段停留（edges-relative-failed），改绝对目标后重跑。样例路径准备失败（edges-fixture-failed）另留原始记录，不作产品FAIL。原相对调用的green-relative/usability-relative保留，但不作为最终代码结果。

五项门禁本轮重跑退出0：backend指定pytest157项、ruff；frontend指定pnpm typecheck、Vitest174项、build。原始日志与命令/退出码见checks.json及*.log，既有Starlette/httpx弃用、NumPy RankWarning与React key警告保留。git diff --check通过；未改计算/导出/快照/依赖/配置/backend，无JSDOM布局替代。

证据分包上传并回下载验证（QA原包已核对4,148,349字节与SHA256，附件引用见qa-reference.json，不重复打包）：

| 包 | 字节 | SHA256 | manifest载荷数 |
|---|---:|---|---:|
| [ZIP 1](/api/attachments/071fe1ee-9766-49d1-8c0b-4726e05ef124/content?download=1) | 7487114 | `d260d035c2d04b05a89acb816d00f1f33f3c5b257002a5135769f395b4b4dccc` | 86 |
| [ZIP 2](/api/attachments/aa1e1133-1b81-4484-90ee-1d3fb9e5679a/content?download=1) | 7459857 | `62b966db7d5ca07e319bbd9437ffb9b6f197bc1266c094d969f9c0f0c4ed3da6` | 88 |
| [ZIP 3](/api/attachments/a687ce22-0889-4f24-b518-a1a0b743e12b/content?download=1) | 7393639 | `d165cb3538f2f303967824c315dbb29d535ed779b70a78afc1e4d430124baf60` | 131 |
| [ZIP 4](/api/attachments/9d9170c6-c767-4502-8944-1011cbe765cf/content?download=1) | 2556740 | `e4ac8798593f17e4fbdbbd255926e2603b9ad2d95cbb7c12930439456b6e0394` | 39 |

各包manifest路径集合=全部载荷+manifest自身，逐项大小/SHA256一致，manifest不自引用；global-inventory.json列出的343个原始载荷在全部包恰各出现一次，集合闭合，无重复/遗漏/额外文件。仅合成数据，无秘密或用户数据；verify_archives.py可离线核对所有ZIP。上传helper本机临时目录受限时按技能规定API上传，未改权限。

本次仅开发者Firefox headless自动化复验；等待Lead重新独立审查后交原QA任务验收，无本次QA PASS。T09整体、200%缩放、方向键选择、Chrome/Safari、人工矩阵、屏幕阅读器和外部验收仍未完成，Phase4 MVP未完成。


## 迭代 #28：真实200%浏览器缩放验证（未执行）

- 目标：仅验证 Phase4.4b/T09 的真实浏览器 200% 页面缩放。基线为已存在的 [9726e79b59d227d9b664c55ed48e1be775ca8a62](https://github.com/CubicZnS/labflow/commit/9726e79b59d227d9b664c55ed48e1be775ca8a62)，宿主隔离分支 `MAC-176-labflow-unattended-iteration`；未切换分支、未创建 iter/28。
- 执行时间：2026-10-28 20:01 Asia/Shanghai。macOS 27.0.1（26A434）；Firefox 158.0.1（buildID 20261019185856）headless；geckodriver 0.37.1（300705c65d1b）；Python urllib 标准库客户端 3.9.6（无 Selenium）；后端 Python 3.12.14、Node 24.19.0、pnpm 11.28.5、Vite 构建 7.3.7。会话版本见 `capabilities.json`，宿主版本见 `tooling.txt`，不以 UA 替代 OS 版本。
- Browser plugin not available；项目未配置 Playwright，版本命令退出1；既有临时 Selenium 环境导入失败（ModuleNotFoundError），未安装依赖。改用 WebDriver HTTP 创建独立 Firefox 会话。本轮服务为本分支 frontend `http://127.0.0.1:5178/`、backend `127.0.0.1:8000`、geckodriver `127.0.0.1:4444`；没有复用5173上的旧分支页面。系统只读检查 `osascript -e 'tell application "System Events" to get UI elements enabled'` 返回 false，未更改权限或启用特权浏览器上下文。

复现操作：启动后端 `.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`，前端 `/Users/zhangzimo/.local/bin/pnpm dev --host 127.0.0.1 --port 5178 --strictPort`，启动已有 `/tmp/labflow-browser/bin/geckodriver --host 127.0.0.1 --port 4444`。将证据解包至临时目录后 `python3 probe.py`：新建 headless 会话，外窗设置1440×1100，导航真实页面，采样及截图；W3C Actions 按住 Meta，发送五次 `+` 后释放，再采样及截图。脚本退出0仅表示探测结束，不表示缩放PASS。未使用CSS zoom、transform、内容viewport缩小或设备模拟。

| 项目 | 实际证据与判定 |
|---|---|
| 缩放前 | innerWidth=1440、outerWidth=1440、innerHeight=1015、outerHeight=1100、DPR=1；`before.json/png` |
| Command + “+” 五次后 | innerWidth=1440、outerWidth=1440、innerHeight=1015、outerHeight=1100、DPR=1；CSS zoom=1、transform=none；`after-command-plus-five.json/png` |
| 真实200%缩放 | **未执行**：内容按键未产生可证明的浏览器页面缩放；当前没有可用浏览器 UI 自动化能力。尺寸未变化，不把发送快捷键算作缩放成功；不无限重试 |
| 200%后的导入、X/Y配对、拟合 | **未执行**：缩放前置条件未满足，无本轮合成数据上传及分析请求证据 |
| 200%后的项目保存、SVG/PNG下载 | **未执行**：无本轮项目或下载文件，不以历史成功补充为本轮PASS |
| 200%后的溢出、可达性、表内滚动、焦点/描边 | **未执行**：没有缩放后的实际内容视口；未作全键盘/点击补充验收，无产品缺陷判定 |
| 页面身份与截图 | URL为5178、标题“LabFlow · 科研数据分析”，基础页面非空、截图无框架错误覆盖层；不代表工作流或完整控制台健康审计 |

[本任务原始证据ZIP](/api/attachments/5ad71464-13fd-4c35-970a-f34911bbea72/content?download=1)：506,213字节，SHA-256 `e88564b2454a53eedbe65c483142349fad5eccc54e25061614f82e742f916ef7`。上传后回下载字节一致，manifest.json列出的18个载荷路径、大小、SHA256全部核验且集合闭合；manifest自身不自引用。包内含探测脚本、前后截图/几何、工具版本、原始驱动/服务日志及五项门禁日志，无秘密或用户数据。没有工作流请求捕获或下载文件，不虚构证据。

门禁：backend `.venv/bin/python -m pytest -q` 退出0，157项（72+72+13）；`.venv/bin/ruff check app tests` 退出0。frontend指定pnpm `typecheck`、`test:run`（6文件174项）、`build`（36模块）均退出0。pytest保留Starlette/httpx弃用及NumPy RankWarning，前端保留React key警告；驱动日志保留Firefox sandbox_extension、SWGL、内置Experiment与UrlClassifier警告，不声称完整控制台无异常。提交前 `git diff --check`另行记录。

本轮只交付工具限制和文档证据，不自行QA、不合并、不推dev/main、不部署、不改配置。真实200%工作流、T09整体及Phase4 MVP均未完成；方向键、其他浏览器、人工矩阵与外部验收未纳入本轮。下一轮由Lead独立审查后选择具备真实页面缩放及浏览器 UI 证据能力的环境，再另建QA任务，QA PASS前禁止合并。
