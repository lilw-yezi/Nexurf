---
domain: generic-pdf-viewer
aliases: [pdf viewer, pdfjs, viewer.html, filePath, embedded pdf]
updated: 2026-04-24
status: pattern
---

## Platform Type
- Generic embedded PDF viewer pattern.

## Content Carrier Pattern
- HTML shell loads a PDF through iframe, embed, object, or viewer URL parameter.
- Common parameters include `file`, `filePath`, `url`, `src`, `href`, `path`, `attach`, `attachment`, and `download`.

## Effective Entry
- Open the host page first.
- Run carrier detection to resolve the real PDF URL.
- Use browser-context download fallback when direct download is blocked.

## Known Traps
- Viewer page text may not contain the actual document body.
- PDF URL may be URL-encoded inside query parameters.
- Direct download may fail because of missing cookies or referer.

## Parameter Preservation Rules
- Preserve encoded resource parameters exactly.
- Resolve relative resource URLs against the viewer URL.

## Extraction Notes
- Resolve resource URL first, then route to PDF extraction.
- Return viewer URL and resource URL separately when possible.

## Verification
- Verified date: 2026-04-24
- Verified scenario: generic PDF viewer resource resolution pattern.
