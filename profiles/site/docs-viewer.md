---
domain: docs-viewer
aliases: [在线文档, docs viewer, document viewer, office viewer]
updated: 2026-04-24
status: pattern
---

## Platform Type
- Online document viewer for office files, PDFs, and embedded documents.

## Content Carrier Pattern
- Content may be rendered inside iframe, canvas, PDF viewer, Office preview, or downloadable attachment.

## Effective Entry
- Preserve the viewer URL and all embedded document parameters.
- Run carrier detection before assuming the main page contains text.
- Prefer downloadable PDF/HTML alternatives when available.

## Known Traps
- Canvas-rendered pages may not expose text in DOM.
- Office previews may hide the original file URL behind encoded parameters.
- Viewer pages may require cookies from the host page.

## Parameter Preservation Rules
- Preserve document IDs and file parameters.
- Resolve relative document resources against the viewer page.

## Extraction Notes
- Try viewer resource resolution first.
- For image/canvas-only content, use screenshot or image fallback.

## Verification
- Verified date: 2026-04-24
- Verified scenario: generic document viewer operating pattern.
