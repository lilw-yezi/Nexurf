<div align="center">

# Nexurf

**一个面向 Agent 的浏览器 Skill，用于动态交互、内容提取与可复用站点经验沉淀。**

[English](./README.md) · [MIT License](./LICENSE)

</div>

---

## 项目简介

Nexurf 面向需要真实浏览器环境的 Agent 工作流，适用于访问动态网页、执行页面交互、复用登录态，以及从 iframe、viewer、PDF、Office 文档、图片等复杂承载体中提取内容。

Nexurf 被设计为一套可复用、可持续演进的 Skill / Runtime 基础设施，而不是一次性的站点脚本。

## 核心能力

- 发现官网与稳定入口
- 读取静态页面与动态渲染页面
- 在需要时复用真实浏览器上下文与登录态
- 执行导航、点击、滚动、上传、截图等浏览器动作
- 识别 iframe、embed、viewer、PDF、Office 文件、图片等正文承载体
- 按承载体与格式路由内容提取流程
- 沉淀可复用的站点画像，用于后续任务复用

## 使用方法

Nexurf 依赖一个本地运行中的 Chromium 内核浏览器，并要求开启 remote debugging。使用前请先完成以下准备。

### 1. 准备支持的浏览器
可以使用以下浏览器之一：
- Google Chrome
- Chrome Canary
- Chromium

### 2. 开启 remote debugging
启动浏览器时带上 remote debugging 端口参数。

macOS 示例：

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

如果浏览器已经在运行，请先彻底退出，再带参数重新启动。

### 3. 确认浏览器调试权限已开启
浏览器启动后，打开：

```text
chrome://inspect/#remote-debugging
```

确认当前浏览器实例已经开启 remote debugging。

### 4. 保持浏览器会话存活
在 Nexurf 使用期间，不要关闭浏览器。Nexurf 依赖这个实时浏览器会话来完成页面访问、交互和登录态复用。

### 5. 在你的 Agent 环境中使用 Nexurf
浏览器准备好之后，就可以在支持本地 Skill 执行和 browser bridge 访问的 Agent 环境中使用 Nexurf。

## 仓库结构

```text
.
├── SKILL.md
├── README.md
├── README_CN.md
├── LICENSE
├── .gitignore
├── references/
│   ├── browser-api.md
│   ├── content-extraction.md
│   └── site-profiles/
└── scripts/
    ├── browser-bridge.mjs
    ├── check-runtime.mjs
    └── match-profile.mjs
```

## 组成部分

### `SKILL.md`
定义 Nexurf 在 Agent 工作流中的使用规则，包括路径选择、浏览器使用原则、提取策略与站点画像调用方式。

### `scripts/check-runtime.mjs`
用于检查本地运行环境，并确保 Nexurf bridge 可用。

### `scripts/browser-bridge.mjs`
提供浏览器侧 bridge，支持页面创建、导航、检查、交互、承载体识别、内容提取与清理。

### `scripts/match-profile.mjs`
用于将任务描述或目标站点与现有站点画像进行匹配。

### `references/browser-api.md`
记录 bridge 的接口、动作边界与返回约定。

### `references/content-extraction.md`
记录多格式内容提取所使用的承载体识别与提取路由方法。

### `references/site-profiles/`
保存可复用的站点经验，例如稳定入口、已知陷阱和参数保留规则。

## 典型使用场景

- 官网与一手来源核实
- 动态页面读取
- 浏览器交互流程执行
- 嵌入式文档提取
- 多格式内容读取
- 站点经验沉淀与复用

## 许可证

本项目采用 [MIT License](./LICENSE) 开源。
