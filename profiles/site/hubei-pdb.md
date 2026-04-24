---
domain: hubei.gov.cn/pdb
aliases: [湖北省法规规章规范性文件数据库, 湖北政策库, hubei pdb, 湖北规范性文件库]
updated: 2026-04-24
status: verified-site
---

## Platform Type
- Provincial regulation, rule, and administrative normative document database.
- Search/list/detail workflow for policy and government documents.

## Content Carrier Pattern
- Search result list is rendered in the browser and can include empty query parameters.
- Detail page metadata is visible in DOM.
- Main document body may not be present in DOM.
- Document body is commonly exposed through WPS/OFD/PDF buttons.
- PDF button may trigger `window.open()` with the real PDF URL and may also create a PDF.js iframe.

## Effective Entry
- Preserve the full search URL, including empty parameters:
  - `fileType=all`
  - `keyword=`
  - `postNumber=`
- Open the search page in browser context.
- Extract list titles, detail URLs, document number, publisher, release date, category, and interpretation links.
- Open each detail page in browser context.
- Read metadata from DOM first.
- Intercept or observe `#pdf-print`, `#ofd-print`, and `#wps-print` when full text is needed.

## Known Traps
- Do not drop empty query parameters from the search URL.
- Detail page body may appear absent even when the document exists.
- PDF/WPS/OFD buttons are not normal anchors.
- Some PDF resources may resolve to malformed values such as `//www.hubei.gov.cn/pdbstaticsnull`.
- Resource failure should be recorded as resource failure, not as policy absence.
- Some original PDF files are hosted on department or city subdomains, such as `img.xxgk.yichang.gov.cn` or `kjt.hubei.gov.cn`.

## Parameter Preservation Rules
- Preserve the complete search URL and detail URL.
- Preserve `articleid` and `sign` values.
- Preserve PDF file URL exactly when captured from `window.open()`.

## Extraction Notes
- Metadata fields observed:
  - `#title`
  - `#postNumber`
  - `#publisher`
  - `#validity`
  - `#releaseDate`
  - `#themeCategory`
  - `#source`
- Full text route:
  1. open detail page
  2. intercept `window.open`
  3. click `#pdf-print`
  4. capture PDF URL
  5. download PDF with page referer when needed
  6. extract text from PDF
- If PDF URL is null/malformed, report metadata and search for source-site or interpretation links.

## Verification
- Verified date: 2026-04-24
- Verified scenario: first five results from `https://www.hubei.gov.cn/pdb/search.shtml?fileType=all&keyword=&postNumber=`.
- Verified results:
  - list extraction succeeded
  - detail metadata extraction succeeded
  - PDF full text extraction succeeded for items 1, 2, 4, and 5
  - item 3 returned malformed PDF resource `//www.hubei.gov.cn/pdbstaticsnull`
