# Browser Bridge API

该文件描述 Nexurf 的浏览器桥接层能力边界与当前实现状态。

## 当前已实现动作
- `GET /health`：查看桥接服务状态、浏览器连接状态、当前页面数
- `GET /pages`：列出当前页面上下文
- `GET /open?url=...`：新建页面上下文，返回 `pageId`
- `POST /open`：推荐用于复杂 URL 传递，body 传 JSON `{ "url": "完整URL" }`
- `GET /goto?pageId=...&url=...`：页面导航
- `POST /goto`：推荐用于复杂 URL 传递，body 传 JSON `{ "pageId": "...", "url": "完整URL" }`
- `GET /back?pageId=...`：页面后退
- `GET /inspect?pageId=...`：读取页面基础信息
- `POST /eval?pageId=...`：执行页面脚本；body 可直接放 JS 表达式，或传 JSON `{ "expression": "..." }`
- `POST /tap?pageId=...`：JS 点击元素；body 可直接放 selector，或传 JSON `{ "selector": "..." }`
- `POST /clickAt?pageId=...`：真实鼠标点击；body 可直接放 selector，或传 JSON `{ "selector": "..." }`
- `POST /upload?pageId=...`：向 file input 注入本地文件；body 传 JSON `{ "selector": "...", "files": ["/path/a.png"] }`
- `GET /scroll?pageId=...&direction=down&y=3000`：页面滚动
- `GET /snap?pageId=...&file=/tmp/a.png`：截图，可保存到本地文件
- `GET /carrier?pageId=...`：识别正文承载体，返回 `contentKind`、`resourceUrl`、`frameSrc/embedSrc` 等信息
- `GET /extract?pageId=...`：对已识别的承载体执行内容提取；当前已实现 PDF 文本提取，并在直连下载受阻时回退到浏览器上下文下载
- `GET /close?pageId=...`：关闭页面上下文

## 统一约定
- 动作语义优先，不要求对外暴露底层 CDP 细节
- 页面上下文使用 `pageId` 抽象，不直接暴露内部 session 概念
- URL 传入 bridge 时默认保留完整原始地址，包含全部 query 参数与空值参数
- 返回值统一为 JSON
- 出错返回：
  - `ok: false`
  - `error.code`
  - `error.message`
  - `error.details`

## 当前能力特征
- 已支持浏览器发现与 WebSocket 连接
- 已支持单页上下文抽象与 target attach
- 已支持基础 readyState 等待
- 已支持基础反探测：拦截页面探测本机浏览器调试端口的请求
- 已支持单实例端口占用检测
- 已支持正文承载识别：可识别 iframe/embed/pdf viewer，并返回真实资源 URL 候选
- 已支持 PDF extractor：可下载 PDF 并提取文本（优先 fitz，回退 pdfminer）
- 已支持“浏览器上下文下载回退”：当 PDF 直连下载被站点以 412 等方式拦截时，改为借浏览器上下文 fetch 下载再提取
- 已支持多格式基础路由骨架：carrier 识别阶段会收集页面中的 `alternativeResources`，供 OFD / Office 等格式优先寻找 PDF 替代资源
- 已支持 DOCX 轻量原生提取：无需额外安装依赖，直接用 Python 标准库解 zip 并读取 `word/document.xml`
- 已支持图片资源兜底：当识别到 image 承载时，可先下载原图资源并返回 `savedPath`，为后续 OCR / 视觉识别预留统一入口

## 已执行的运行限制
- bridge 默认以后台常驻方式复用，不要求每次任务后停止
- 页面操作默认只针对 Nexurf 自己创建的 `pageId`
- URL 打开与跳转默认保留完整原始地址，不主动裁剪参数
- 对复杂 URL，推荐使用 POST JSON 方式传入，避免 query 链路截断
- 对站内链接，优先保留页面里自然产生的完整地址
- 页面异常时，优先检查 URL 参数完整性、跳转方式与等待时机

## 内容提取约定
- `/carrier` 用于回答“正文承载在哪里”
- `/extract` 用于回答“已经识别承载体后，正文能否继续被提取出来”
- 当前 `/extract` 已打通 PDF 路径，并固化了“直连下载失败 -> 浏览器上下文下载回退 -> 文本提取”的处理链路
- 多格式推进时，应尽量复用统一返回结构，而不是为每种格式发明完全不同的输出

详细方法论见：`references/content-extraction.md`

## 后续扩展方向
- OFD 原生 extractor（当前先走替代 PDF 优先策略）
- DOC / DOCX / WPS extractor
- 图片 / 扫描件 OCR extractor
- frame 与 shadow-root 辅助操作
- 视频关键帧采样
- 批量页面任务
- 更细粒度的页面等待策略
