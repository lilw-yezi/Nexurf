---
domain: institution-notice
aliases: [机构通知, 学校通知, 医院公告, 招标公告, 通知公告]
updated: 2026-04-24
status: pattern
---

## Platform Type
- Institutional notice and announcement pages from schools, hospitals, research institutes, associations, and public agencies.

## Content Carrier Pattern
- Content usually lives in HTML article body with possible attachments.
- Some sites use older CMS templates and inconsistent metadata.

## Effective Entry
- Extract title, date, source/department, body, and attachments.
- Prefer official institution domain.
- Preserve notice category and original URL.

## Known Traps
- Notices may be duplicated across departments.
- Attachments may carry the actual form or full notice.
- Date fields may appear in breadcrumb or footer and pollute extraction.

## Parameter Preservation Rules
- Preserve article ID and category path.

## Extraction Notes
- Use article/main/content selectors before body fallback.
- Separate body text from footer/navigation.

## Verification
- Verified date: 2026-04-24
- Verified pattern pending broader live regression.
