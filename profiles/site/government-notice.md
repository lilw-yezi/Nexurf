---
domain: government-notice
aliases: [公告, 通知, 政策, 政府公告, 政务公开]
updated: 2026-04-24
status: pattern
---

## Platform Type
- Government notice, announcement, and public-policy pages.

## Content Carrier Pattern
- Content may appear as HTML article body, PDF/OFD attachment, Office file, or scanned image.

## Effective Entry
- Prefer official domain and original notice page.
- Inspect links and attachments when HTML body is short.
- Preserve publish date, title, issuing department, and original URL.

## Known Traps
- Index pages may duplicate titles but not contain full text.
- Attachment links may be relative and require the original page URL as base.
- Some pages hide text inside older editor containers.

## Parameter Preservation Rules
- Preserve article IDs, channel IDs, and file parameters.
- Use natural page links for attachments.

## Extraction Notes
- Try DOM selectors first, then carrier detection.
- Route PDF/DOCX/OFD/image resources through extraction fallback.

## Verification
- Verified date: 2026-04-24
- Verified scenario: government notice operating pattern.
