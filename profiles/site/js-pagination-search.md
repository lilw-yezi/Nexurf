---
domain: js-pagination-search
aliases: [JS分页, 搜索分页, dynamic pagination, form search]
updated: 2026-04-24
status: pattern
---

## Platform Type
- Search and list pages that use JavaScript pagination or form-driven filters.

## Content Carrier Pattern
- Results may be rendered after JavaScript execution.
- Pagination controls may use `javascript:;` instead of href.
- Empty query parameters may carry meaning.

## Effective Entry
- Preserve original query string.
- Use browser context when static fetch does not show result items.
- Extract page count, total count, current page, result list, and detail URLs.
- For pagination, click natural page controls or call the page's own search function if visible.

## Known Traps
- `javascript:;` links are not navigable URLs.
- Dropping empty parameters can change results.
- Sorting defaults may matter.
- Result count can be loaded separately from result list.

## Parameter Preservation Rules
- Preserve all query parameters, including empty values.
- Record form state before changing filters.

## Extraction Notes
- Prefer DOM result extraction after page ready.
- For batch extraction, collect detail URLs first, then open details separately.

## Verification
- Verified date: 2026-04-24
- Verified scenario: Hubei policy database search page with empty `keyword` and `postNumber` parameters.
