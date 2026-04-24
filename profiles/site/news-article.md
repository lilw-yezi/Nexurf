---
domain: news-article
aliases: [新闻, 文章, news, article, media]
updated: 2026-04-24
status: pattern
---

## Platform Type
- News and article publishing sites.

## Content Carrier Pattern
- Content usually lives in HTML article nodes, but may include lazy-loaded images, embedded videos, or paginated bodies.

## Effective Entry
- Prefer original article URL.
- Extract title, publish time, author/source, and article body.
- Scroll when content is lazy-loaded.

## Known Traps
- Aggregators may copy partial content.
- Advertisement and recommendation blocks may pollute body text.
- Some pages split article body across pages.

## Parameter Preservation Rules
- Preserve article IDs and canonical URLs.
- Avoid tracking parameters only after canonical URL is confirmed.

## Extraction Notes
- Prefer article/main/content selectors before body fallback.
- Use screenshot only when DOM text is unavailable.

## Verification
- Verified date: 2026-04-24
- Verified scenario: generic article extraction pattern.
