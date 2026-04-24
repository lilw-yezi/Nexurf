---
name: nexurf
description: Nexurf 是一个面向 Agent 的网页访问与浏览器接入 Skill，用于来源发现、动态页面读取、真实浏览器交互、登录态复用、多格式正文提取，以及站点经验的可复用沉淀。适用于官网核实、复杂网页读取、嵌入式文档提取和需要长期演进的 Agent Web Runtime 场景。
---

# Nexurf

## 适用场景
当任务需要以下能力时，使用 Nexurf：
- 定位官网或一手来源
- 读取静态或动态页面正文
- 在真实浏览器环境中完成点击、滚动、上传、截图等交互
- 复用浏览器登录态或真实页面上下文
- 处理 iframe、embed、viewer、PDF、Office、图片等复杂正文承载体
- 将站点入口、陷阱、参数规则沉淀为可复用画像

当任务仅需简单静态网页读取，且无需交互、登录态或复杂承载识别时，不必默认使用浏览器接入。

## 目标
Nexurf 的目标是为 Agent 提供一套稳定、可复用、可持续扩展的网页访问方法。

使用 Nexurf 时，应始终围绕以下结果推进：
- 拿到用户需要的事实、正文或操作结果
- 明确识别正文承载方式与真实资源位置
- 在无法直接获取内容时，给出下一步最有效动作
- 把可复用的站点经验沉淀下来

## 核心原则
### 1. 先定义完成标准
先判断用户要的到底是：
- 一个事实
- 一段正文
- 一组截图
- 一次交互结果
- 一份核实结论

没有完成标准，就无法判断当前路径是否有效。

### 2. 先选最短有效路径
默认按任务目标选择路径：
- 找入口、找来源：先搜索
- URL 已知，提取正文或字段：先静态读取
- 需要结构、meta、脚本数据：先看原始源码或响应
- 需要真实交互、登录态或动态渲染：使用浏览器接入

### 3. 一手来源优先
核实类任务优先：
- 官网
- 原文
- 官方文档
- 官方仓库
- 官方公告

搜索结果和聚合页主要用于定位，不作为最终证明。

### 4. 保留完整 URL 与参数
Nexurf 默认保留：
- 原始 URL
- query 参数
- 空值参数
- 页面自然跳转产生的完整链接

出现空白、跳错、结果缺失时，应优先怀疑参数丢失、上下文丢失或进入方式错误，而不是先假设内容不存在。

### 5. 最小侵入
- 默认只操作自己创建的页面上下文
- 不主动接管用户已有页面
- 完成后关闭自己创建的页面上下文
- Runtime Service 默认常驻复用，不为每次任务重复拉起

### 6. 达标即停
当任务完成标准已经满足时，应停止继续追加无意义动作。

## 推荐流程
### 第一步：运行时检查
进入浏览器接入前，先运行：

```bash
node "${CLAUDE_SKILL_DIR}/runtime/doctor.mjs"
```

该检查用于确认：
- Node.js 可用
- 浏览器远程调试可用
- Nexurf Runtime Service 可用
- 站点画像目录可用

如果环境未就绪，再提示用户处理本地浏览器或运行时问题。

在执行浏览器自动化前，先提示用户：

```text
温馨提示：部分站点对浏览器自动化操作检测严格，存在账号限流、封禁或行为校验风险。Nexurf 会尽量采用低侵入方式，但无法完全避免平台风控。
```

### 第二步：选择任务路径
| 目标 | 建议路径 |
|------|---------|
| 找来源、定位官网、找入口 | 搜索 |
| 已知 URL，提取正文或字段 | 静态读取 |
| 查看原始结构、meta、脚本数据 | 原始源码/响应 |
| 需要真实交互、登录态、动态渲染 | 浏览器接入 |

以下信号通常意味着应升级到浏览器接入：
- 静态结果明显缺正文
- 页面依赖前端渲染
- 需要点击、滚动、上传
- 需要真实浏览器上下文或登录态
- 页面正文疑似承载在 iframe、viewer 或外部资源中

### 第三步：持续判断路径是否有效
执行过程中持续检查：
- 当前步骤是否更接近完成标准
- 返回结果是在证明路径正确，还是提示应切换路径
- 当前问题是信息不足，还是方式错误

不要连续重试同一种已证明无效的方式。

## 浏览器接入使用原则
### 程序化操作优先
当目标可以通过直接导航、DOM 读取、文本提取、链接提取完成时，优先使用程序化方式。

### 真实交互优先
当任务依赖：
- 用户手势
- 页面自然进入路径
- 懒加载触发
- 上传文件
- 登录态页面行为

则优先使用真实交互方式。

## 内容提取原则
如果主页面只有标题、元信息、下载入口、加载中提示，而正文缺失，不要直接判定“没有正文”。

优先按以下顺序推进：
1. 识别正文承载体
2. 提取真实资源 URL
3. 判断资源格式
4. 路由到对应 extractor
5. 返回统一结果

重点关注的承载体包括：
- iframe / frame
- embed / object
- PDF viewer
- Office viewer
- PDF / OFD / DOC / DOCX / WPS
- 图片 / 扫描件 / canvas

当前可直接复用的重点链路包括：
- iframe / viewer / PDF 识别
- PDF 真实资源提取
- 下载失败时回退到浏览器上下文下载
- 下载后继续文本提取

因此应默认遵循：
- 主页面没正文，不等于没有正文
- 下载失败，不等于资源不存在
- 先换路径，再下结论

需要多格式提取细节时，读取：`docs/content-extraction.md`

## 登录判断
登录不是默认动作。只有当以下两个条件同时满足时，才提示用户登录：
1. 当前确实拿不到目标内容
2. 登录后大概率能解决问题

提示时应说明：
- 是哪个网站
- 当前缺的是什么内容
- 登录后可以继续完成什么

## 站点画像
进入具体站点后，可运行：

```bash
node "${CLAUDE_SKILL_DIR}/runtime/profile-engine.mjs" "用户请求或目标站点"
```

若命中画像，优先复用已有经验。

站点画像位于：
- `profiles/site/_template.md`
- `profiles/site/<domain>.md`

画像中应只记录：
- 已验证的平台特征
- 有效入口
- 已知陷阱
- 应保留的参数或操作模式

不要记录未经确认的猜测。

## 何时读取额外参考
- 需要 Runtime API 动作与接口边界：读取 `docs/runtime-api.md`
- 需要多格式提取方法：读取 `docs/content-extraction.md`
- 已确定目标站点：读取对应的 `profiles/site/<domain>.md`

## 目录要求
Nexurf Skill 目录至少应包含：
- `SKILL.md`
- `runtime/doctor.mjs`
- `runtime/service.mjs`
- `runtime/profile-engine.mjs`
- `docs/runtime-api.md`
- `docs/content-extraction.md`
- `profiles/site/`
- `quality/regression/`

`script/` 目录仅保留兼容入口；新开发与文档均以 `runtime/`、`docs/`、`profiles/`、`quality/` 为主。

## 完成标准
一次 Nexurf 任务完成时，至少应满足以下之一：
- 已拿到用户需要的事实、正文或操作结果
- 已识别正文承载方式与真实资源位置
- 已明确说明当前阻塞与下一步最有效动作
- 已沉淀可复用的站点经验

如果只是执行了一些浏览器动作，但没有产出上述结果，则不算完成。


## 质量检查
发布或大改后，优先运行：

```bash
npm run test
```

该命令会执行语法检查、脱敏扫描、站点画像测试和 Runtime API smoke test。


## 场景库优先级
遇到真实网页任务后，优先判断是否属于已有场景：

- 政务政策库 / 政府信息公开
- PDF/OFD/WPS/Office viewer
- 按钮触发文档资源
- 搜索分页 / 表单筛选 / 空参数查询
- 新闻文章 / 机构通知
- 开发者文档 / GitHub / 包注册表
- 动态页面 / 登录墙 / 资源异常

如果任务中发现新的稳定模式，应补充 `profiles/site/` 和 `quality/regression/`，让 Nexurf 越用越可复用。


## 承载体自动识别
Nexurf 1.6 的 `/carrier` 会尝试自动识别按钮触发的文档资源。

重点识别：
- PDF版本 / OFD版本 / WPS版本
- 附件 / 下载 / 正文 / 全文 / 预览
- `window.open()` 触发的资源
- 新增 iframe / embed / object
- `null` / `undefined` / `pdbstaticsnull` 等资源异常

使用时优先调用 `/carrier`，再根据 `carrier.resourceUrl`、`carrier.resourceIssue`、`carrier.interactiveDocumentResources` 和 `alternativeResources` 判断下一步。


## Task Runner
Nexurf 1.7 提供任务级入口：

```bash
npm run task -- "目标URL" --goal inspect-site
npm run task -- "目标URL" --goal extract-page
npm run task -- "目标URL" --goal extract-documents
npm run task -- "目标URL" --goal extract-list --limit 5
```

可用 goal：
- `inspect-site`：站点诊断与承载体识别
- `extract-page`：单页正文提取
- `extract-documents`：文档资源提取
- `extract-list`：列表页批量详情提取

当用户给出 URL 和明确抓取目标时，优先考虑 Task Runner；当 Task Runner 失败时，再降级到 Runtime API 单步处理。
