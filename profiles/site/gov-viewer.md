---
domain: gov-viewer
aliases: [政务站, 政府网站, pdfjs, viewer, iframe, 规范性文件]
updated: 2026-04-24
---

## 平台特征
- 政务详情页常见“主页面只放标题与元信息，正文在 iframe / viewer / PDF / OFD / Office 资源里”。
- PDF viewer 常通过 `viewer.html?file=`、`filePath=`、`url=`、`src=` 等参数指向真实正文资源。
- 直连下载可能因为 Referer、Cookie、412、防盗链等限制失败。

## 有效入口
- 先读取主页面并保留完整 URL 参数。
- 主 HTML 正文不足时，先跑 `/carrier` 识别 iframe、embed、object、viewer、候选附件。
- PDF 直连失败时，优先用浏览器上下文 fetch 回退下载。
- OFD / Office 优先找同页 PDF 或 HTML 预览替代资源。

## 已知陷阱
- 主页面没有正文，不等于政策正文不存在。
- 下载失败，不等于资源不存在。
- 裁剪 query 参数很容易导致 viewer 空白或跳错资源。
- 附件链接文字可能只写“下载 / 附件 / 查看”，需要结合 URL 后缀与 viewer 参数判断格式。

## 备注
- 该画像用于沉淀政务 viewer 类站点的通用行为，不代表单一域名。
