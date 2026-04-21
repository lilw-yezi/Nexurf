# Content Extraction Reference

## 目标
把“正文抓取”从单一 DOM 抽取，升级为统一的内容承载识别与格式路由能力。

## 标准链路
1. 识别承载体（carrier detection）
2. 提取真实资源 URL（resource resolution）
3. 判断资源格式（format classification）
4. 进入对应 extractor（extractor routing）
5. 返回统一结果（contentText / contentKind / extractionConfidence）

## 承载体识别信号
### HTML 正文
- 主 DOM 中存在明显正文节点
- 正文文本长度充足
- 不依赖 viewer 承载

### iframe / frame
- 正文区为空或很短
- 存在 iframe/frame
- iframe src 指向详情内容、viewer、静态资源或中间页

### embed / object
- 常用于 PDF、Office、媒体资源嵌入
- 应继续追真实资源地址，而不是停在宿主页面

### viewer
典型包括：
- pdf.js viewer
- Office viewer
- 站点自研 viewer

常见参数：
- `file=`
- `filePath=`
- 真实文件 URL 作为 query 参数或路径片段

## 当前已落地能力
### PDF
- 已支持 carrier 检测
- 已支持 viewer URL 解析真实 PDF 地址
- 已支持直连下载
- 已支持浏览器上下文下载回退（应对 403/412/Referer/Cookie 限制）
- 已支持 fitz / pdfminer 文本提取

### 验证通过案例
- 湖北省法规规章规范性文件数据库详情页
- 正文不在主 HTML，而在 iframe + pdf.js viewer + PDF 文件中
- 直连下载被 412 拦截时，浏览器上下文下载成功
- 最终成功抽出正文文本

## 依赖最小化策略
为了提高 Skill 的泛用性，内容提取默认遵循“少安装、少绑定、少重依赖”的路线：

1. 优先浏览器自身能力
   - 承载体识别
   - 页面内下载
   - DOM / iframe / viewer 信息提取
   - 截图 / canvas / 已渲染内容读取

2. 优先标准库与环境已存在能力
   - Node.js 标准库
   - Python 标准库
   - 环境里已经存在的解析库（例如已装好的 PDF 能力）

3. 额外依赖不作为默认前提
   - 不把 OFD、DOC、OCR 的第三方安装当成 Skill 默认前提
   - 先给出原生路径、条件路径、fallback 路径三层设计

## 后续格式推进建议
### OFD
优先策略：
1. 先识别 `.ofd` 或 OFD viewer
2. 先找是否存在 PDF/HTML 预览替代路径
3. 当前 bridge 会同时扫描页面中的候选链接，收集 `alternativeResources`
4. 若存在 PDF 替代资源，优先回退到 PDF extractor，而不是强依赖 OFD 原生解析器
5. 若无替代路径，再考虑 OFD 解析器或转码链路
6. 若环境里没有可用 OFD 解析能力，则至少返回资源 URL、承载类型、替代资源和后续建议，不让链路中断

### DOC / DOCX / WPS
优先策略：
1. 优先提取原始资源 URL
2. DOCX 优先走轻量结构化文本提取
   - 当前已支持用 Python 标准库直接解 zip + 读取 `word/document.xml`
   - 不依赖额外安装的 docx 解析库
3. DOC / WPS 优先看是否存在 HTML/PDF 预览
4. 如无原生解析能力，则回退浏览器上下文或 OCR 兜底

### 图片 / 扫描件
优先策略：
1. 判断是否图片型 PDF 或纯图片正文
2. 能拿原图就优先拿原图
3. 当前 bridge 已支持先把图片资源下载到本地并返回 `savedPath`
4. 再在此基础上接轻量 OCR / 视觉识别兜底
5. 不默认绑定必须额外安装的重型 OCR 环境

## 统一结果建议
输出尽量统一包含：
- `contentKind`
- `carrierKind`
- `resourceUrl`
- `contentText`
- `extractionConfidence`
- `downloadMode`
- `fallbackUsed`

## 经验规则
- 主页面没正文，不等于没有正文
- 下载失败，不等于资源不存在
- 优先怀疑：参数丢失、viewer 包裹、防盗链、Cookie/Referer 限制、扫描件
- 先换路径，再下结论
- 缺少第三方解析器，不等于整个链路失败；至少要把承载体、资源 URL、可用 fallback 说清楚
