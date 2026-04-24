---
domain: office-preview
aliases: [WPS预览, Office预览, doc viewer, xls viewer, word preview]
updated: 2026-04-24
status: pattern
---

## Platform Type
- Office document preview pages and WPS/Word/Excel/PowerPoint viewer flows.

## Content Carrier Pattern
- Viewer shell may not expose document text.
- Resource may be hidden inside query parameters, JavaScript, iframe, or button handlers.

## Effective Entry
- Capture viewer URL and original document URL separately.
- Prefer direct file resource when available.
- Use viewer screenshot when text extraction is unavailable.

## Known Traps
- Canvas-based previews may have no selectable text.
- Direct file URL may require referer/cookie.
- Viewer controls can load pages lazily.

## Parameter Preservation Rules
- Preserve encoded file path and document IDs.
- Resolve relative file resources against viewer URL.

## Extraction Notes
- DOCX can be extracted when direct resource is available.
- XLSX/PPTX may require specialist extraction or fallback.

## Verification
- Verified date: 2026-04-24
- Verified pattern based on policy database WPS buttons and generic document viewer behavior.
