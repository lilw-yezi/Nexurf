---
domain: api-docs
aliases: [API文档, developer docs, reference docs, SDK docs]
updated: 2026-04-24
status: pattern
---

## Platform Type
- Developer documentation and API reference sites.

## Content Carrier Pattern
- Content may be static markdown-rendered HTML or client-side documentation app.
- Navigation and code samples are important.

## Effective Entry
- Extract title, endpoint/function name, parameters, request/response examples, and version.
- Preserve canonical URL and anchors.

## Known Traps
- Static fetch may miss SPA-rendered docs.
- Code blocks can be truncated by naive text extraction.
- Version switchers may change content.

## Parameter Preservation Rules
- Preserve anchors, version path, and language tabs when relevant.

## Extraction Notes
- Prefer main documentation container and code blocks.
- Capture tables as structured text when possible.

## Verification
- Verified date: 2026-04-24
- Verified pattern pending broader live regression.
