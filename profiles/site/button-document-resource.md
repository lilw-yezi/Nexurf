---
domain: button-document-resource
aliases: [button PDF, 点击PDF, WPS版本, OFD版本, PDF版本, document button]
updated: 2026-04-24
status: verified-pattern
---

## Platform Type
- Pages where document resources are exposed through clickable elements rather than ordinary links.

## Content Carrier Pattern
- Buttons or divs trigger JavaScript handlers.
- Handlers may call `window.open`, create an iframe, mutate `location.href`, or call an API to resolve the file.
- Common labels: PDF版本, OFD版本, WPS版本, 下载, 附件, 正文, 查看全文.

## Effective Entry
- Inspect DOM for buttons with document labels.
- Intercept `window.open` and observe newly inserted iframes.
- Click only the relevant document button.
- Record both viewer URL and real resource URL.

## Known Traps
- Buttons may not be anchor tags.
- Static link extraction may miss all resources.
- Clicking can open new windows or iframes.
- Resource URLs can be malformed or null.
- Some downloads require original page referer or cookies.

## Parameter Preservation Rules
- Preserve resource URL exactly as emitted by page JavaScript.
- Preserve original page URL as referer.

## Extraction Notes
- Recommended capture pattern:
  - override or observe `window.open`
  - click the button
  - inspect iframe/embed/object additions
  - classify captured resource by extension or content type

## Verification
- Verified date: 2026-04-24
- Verified scenario: Hubei policy database detail pages with PDF/WPS/OFD buttons.
