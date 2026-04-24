# Nexurf Regression Cases

本目录记录 Nexurf 发布前和后续迭代中的真实回归口径。目标不是追求固定站点永远在线，而是覆盖关键能力路径。

## 回归分组

### 1. 连接与恢复稳定性
- `runtime doctor` 能发现 Node / Browser / Runtime Service / Site Profiles。
- 未授权或未连接 Chrome 时，`/health` 必须快速返回诊断字段。
- 未授权或未连接 Chrome 时，`/new` 不得挂到客户端超时，必须快速返回结构化错误。
- 已连接时，`/new -> /info -> /close` 应闭环。

### 2. 页面装载与导航稳态
- `open` 应执行 create target、attach、readyState 等待、快照校验。
- `goto` 应保留完整 URL 参数，并在快照 URL 不一致时显式二次导航校正。
- 复杂 URL 优先用 POST JSON 传入，避免 query 截断。

### 3. 内容承载与多格式提取
- HTML 主正文：`/carrier` 识别为 `html`，`/extract` 返回 DOM 文本。
- iframe / viewer / pdf.js：应识别 viewer 与真实 `file/filePath/url/src` 资源。
- PDF：直连下载失败时应回退浏览器上下文下载。
- OFD / Office：优先寻找同页 PDF/HTML 替代资源；无替代时也要返回资源 URL、候选与 fallback 建议。
- DOCX：在不新增依赖前提下用 Python 标准库解包提取正文。
- 图片：保存原图资源并返回 `savedPath`，为 OCR/视觉识别预留入口。

### 4. 站点画像资产
- `profile-engine.mjs` 应支持 domain、aliases、host-like、正文关键词评分匹配。
- 新站点经验必须只记录验证过的事实，不能写猜测。

## 当前已验收记录
- 2026-04-18：`open -> inspect -> eval -> goto -> back -> scroll -> snap -> carrier -> close` 主链路实跑通过。
- 2026-04-18：`/extract` 在 `https://www.example.com/` 可返回 HTML DOM 正文。
- 2026-04-24：未连接 Chrome websocket 时，`/new?url=about:blank` 实测 0.01s 返回结构化 JSON 错误，不再超时悬挂。
