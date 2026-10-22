# LabFlow 数据与隐私复核（Phase 4.3b-1）

- 复核日期：2026-10-22
- 复核基线：`iter/18`，基于 `dev` 的 `a8e0542e0e59ea4e9438130b0791eb23d777a7fc`
- 范围：当前仓库前端 `frontend/src`、前端静态资源、构建入口 `frontend/index.html`、后端 `backend/app` 与后端依赖声明。
- 结论：当前 MVP 为本地运行形态。上传文件只发送到本机分析服务，在请求内存中解析；后端没有磁盘写入、数据库、账户体系或遥测；前端不接入第三方统计、分析或 AI 服务，也不使用 `localStorage`、`sessionStorage`、Cookie 或 IndexedDB。

本文件只记录当前代码可核验的事实，不构成对尚未部署的服务或未来版本的承诺。

## 数据流清单

| 请求 | 请求方 → 去向 | 载荷 | 说明 |
|---|---|---|---|
| `GET /api/health` | 浏览器 → 本机 FastAPI | 无请求体 | 只返回 `status`、`service`、`version`，用于首页“后端状态”徽标与离线重试。 |
| `POST /api/datasets/csv` | 浏览器 → 本机 FastAPI | `multipart/form-data`，字段 `file`（CSV 文件字节） | 后端在内存中校验、解析并返回行数、列名、数值列、统计、前 10 行预览与警告；不落盘。 |
| `POST /api/datasets/xlsx` | 浏览器 → 本机 FastAPI | `multipart/form-data`，字段 `file`（XLSX 文件字节） | 读取首个工作表，其余契约与 CSV 相同；只在内存中处理。 |
| `POST /api/datasets/series` | 浏览器 → 本机 FastAPI | 文件字节，加 `format`、`x_column`、`y_column`、可选 `x_unit`、`y_unit` | 返回配对后的 X/Y 点、跳过行数、统计与警告；不回写文件。 |
| `POST /api/datasets/fit` | 浏览器 → 本机 FastAPI | 文件字节，加 `format`、`x_column`、`y_column`、`degree`、可选 Y 误差列与单位 | 在内存中拟合并返回系数、R²、残差、不确定度等；不保存结果。 |
| `GET /samples/labflow-demo.csv` | 浏览器 → Vite 开发服务器或 nginx 静态资源 | 无用户载荷 | 读取仓库内置示例 `frontend/public/samples/labflow-demo.csv`；随后构造同名 `File` 走上述 CSV 上传链路。 |

补充事实：

- 前端所有 `fetch` 调用只出现在 `frontend/src/lib/api.ts`（健康检查、三个数据集 POST 端点）与 `frontend/src/components/CsvImportPanel.tsx`（内置示例 GET）。
- 未发现前端请求第三方域名；唯一用户可见外链是首页“查看 GitHub 仓库”指向 `https://github.com/CubicZnS/labflow`，只有用户主动点击时才会访问。
- 后端处理上传时先 `await file.read()` 读入内存，再交给 `io.StringIO`、`io.BytesIO` 或 `load_workbook(..., read_only=True)` 解析，没有写入临时文件或数据库。

## 存储与留存

- **上传文件**：仅在处理请求的内存中读取。CSV 使用 `io.StringIO`，XLSX 使用 `io.BytesIO` 与只读 `openpyxl` 工作簿；响应完成后不保留文件引用。
- **大小上限**：后端 `backend/app/datasets.py` 定义 `MAX_UPLOAD_BYTES = 10 * 1024 * 1024`（10 MB）；CSV 与 XLSX 超过上限均返回 HTTP 413。
- **后端持久化**：`backend/app` 中没有 SQLite、数据库驱动、文件写入或 `Path` 落盘调用；`backend/pyproject.toml` 的运行依赖不包含数据库或对象存储客户端。项目至今没有账户、会话或服务端历史记录。
- **浏览器本地存储**：前端源码中没有 `localStorage`、`sessionStorage`、`document.cookie` 或 `indexedDB` 调用。
  - 核验方式：在仓库根目录执行 `grep -rn "localStorage\|sessionStorage\|document\.cookie\|indexedDB" frontend/src --include='*.ts' --include='*.tsx'`，无匹配。
- **项目文件与图表导出**：`.labflow.json`、SVG 与 PNG 通过内存中的 `Blob` 加带 `download` 属性的 `<a>` 元素触发浏览器下载，不写入 Web Storage、Cookie 或后端；下载完成后由浏览器/系统管理文件落点。

## 第三方与追踪

- 前端运行依赖只有 `react` 与 `react-dom`，没有统计、分析、广告、AI SDK 或远程字体脚本。
- `frontend/index.html` 只加载本地 `/src/main.tsx`，没有第三方 `<script>`、像素、iframe 或远程样式。
- 页面没有跟踪或广告脚本；仓库中出现的 `http://www.w3.org/...` 字符串是 SVG/XML 命名空间标识符，不是网络请求地址。
- 除用户主动点击的 GitHub 仓库链接外，前端不向外部域名发起请求。

## 项目文件内容清单

`.labflow.json`（schema v2）只在浏览器本地生成并下载，包含：

- schema 版本、项目名称（≤80 字符）与备注（≤500 字符）；
- PNG 导出倍率（1×/2×/3×）；
- 原始数据文件名与数据集指纹：格式、字节数、行数、数值列、SHA-256；
- 主系列与追加系列的 X/Y 列名、单位，追加系列顺序；
- 拟合设置（是否曾成功、次数、Y 误差列与单位）；
- 图表标题、网格、刻度密度与字号。

不包含：原始数据行、配对点、拟合系数/残差、警告详情、时间戳、随机数或任何凭据。保存前由前端校验，文件大小上限 256 KB。

## 已知限制

- 当前是本地 MVP：默认只监听本机地址，没有 TLS、鉴权、速率限制或租户隔离。部署到真实服务器前必须重新做隐私与安全复核，并重新评估传输加密、访问控制、日志与留存策略。
- 浏览器或操作系统的下载记录、临时文件与备份不在应用控制范围内；应用只能决定“触发下载”，不能删除用户已保存的文件。
- 第三方浏览器扩展、开发者工具或本机其他进程可能读取本机页面与网络流量，这属于运行环境风险，不在本仓库代码控制范围内。
- 本轮未修复后端用户可见的英文校验错误文案；该工作安排在 Phase 4.3b-2（下一轮）。例如 CSV/XLSX 超限、内容类型不支持等错误仍可能包含英文。
- 本轮未做 axe/WCAG 审计、渗透测试或真实服务器部署验证。

## 复核方法与证据

在 `iter/18` 工作区实际执行并核对：

```sh
# 1. 浏览器存储 API 使用情况（无输出即无匹配）
grep -rn "localStorage\|sessionStorage\|document\.cookie\|indexedDB" frontend/src \
  --include='*.ts' --include='*.tsx'
# 结果：无匹配

# 2. 前端网络请求点
grep -rn "fetch(" frontend/src --include='*.ts' --include='*.tsx' | grep -v test
# 结果：api.ts 的健康检查与通用表单 POST；CsvImportPanel.tsx 的示例 GET；测试文件不计

# 3. 前端/入口中的外部 URL
grep -rnoE "https?://[a-zA-Z0-9./?=_%:-]+" frontend/src frontend/index.html | sort -u
# 结果：127.0.0.1:8000、github.com/CubicZnS/labflow、w3.org 的 SVG/XML 命名空间
# 其中 127.0.0.1 为提示文案，w3.org 为命名空间标识符，github.com 为用户主动点击的外链

# 4. 后端磁盘写入、数据库与路径操作
grep -rniE "open\(|sqlite|database|\.write|savefig|to_csv|to_excel|Path\(" backend/app
# 结果：无匹配

# 5. 后端运行依赖
grep -n "dependencies\|sqlalchemy\|sqlite" -A12 backend/pyproject.toml
# 结果：fastapi、uvicorn、numpy、pandas、openpyxl、scipy、pydantic、python-multipart；无数据库依赖

# 6. 上传上限
grep -n "MAX_UPLOAD_BYTES" -B2 -A4 backend/app/datasets.py
# 结果：MAX_UPLOAD_BYTES = 10 * 1024 * 1024，CSV/XLSX 超限返回 413

# 7. 上传后的内存解析
grep -rn "read()\|BytesIO\|StringIO" backend/app/datasets.py backend/app/main.py
# 结果：file.read()、io.StringIO、io.BytesIO、load_workbook(read_only=True)；无临时文件写入

# 8. 内置示例文件
wc -l frontend/public/samples/labflow-demo.csv
# 结果：13 行（1 行表头 + 12 行示例数据）
```

前端自动化测试还覆盖了健康检查离线、重试恢复，以及隐私说明列表恰好 4 条；后端测试保持 155 项通过。以上命令与结果均来自本轮实际执行，未使用推测数据。
