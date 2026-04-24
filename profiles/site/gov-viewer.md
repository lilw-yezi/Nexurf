---
domain: gov-viewer
aliases: [政务站, 政府网站, pdfjs, viewer, iframe, 规范性文件]
updated: 2026-04-24
status: verified-pattern
---

## Platform Type
- Government notice and policy-document pages.

## Content Carrier Pattern
- Detail pages often contain only title and metadata in the main DOM.
- Full text may live in iframe, embedded viewer, PDF, OFD, Office attachment, or image scan.
- PDF viewers often use `viewer.html?file=`, `filePath=`, `url=`, or `src=` to point to the real resource.

## Effective Entry
- Preserve the complete original URL.
- Run `/carrier` when the main HTML body is short or missing.
- Prefer browser-context download fallback when direct PDF download fails.

## Known Traps
- Empty main DOM does not mean the document is absent.
- Download failure does not mean the resource is absent.
- Query-parameter trimming can break viewer resources.
- Attachment link text may only say “download”, “attachment”, or “view”.

## Parameter Preservation Rules
- Preserve all query parameters from the original page and viewer URL.
- Do not manually shorten `file`, `filePath`, `url`, or `src` values.

## Extraction Notes
- Prefer HTML extraction first when body text is sufficient.
- If iframe/viewer is present, resolve the real resource URL.
- Prefer PDF or HTML alternatives for OFD and Office resources.

## Verification
- Verified date: 2026-04-24
- Verified scenario: policy/document pages with iframe or PDF viewer patterns.
