---
domain: error-resource
aliases: [null resource, malformed URL, resource missing, 资源异常, 下载失败]
updated: 2026-04-24
status: verified-pattern
---

## Platform Type
- Any page where the document exists but its resource URL is missing, malformed, blocked, or generated incorrectly.

## Content Carrier Pattern
- The page metadata is valid, but the resource URL may be null, undefined, empty, or syntactically invalid.
- Examples include `pdbstaticsnull`, `undefined`, empty `filePath`, or broken relative paths.

## Effective Entry
- Record metadata and original page URL.
- Record the exact malformed resource value.
- Try source-site links, interpretation links, alternative formats, or page APIs.
- Do not claim full text was extracted if only metadata was available.

## Known Traps
- Treating malformed resource as document absence.
- Silently skipping failed resources.
- Summarizing unavailable full text as if it was read.

## Parameter Preservation Rules
- Preserve exact malformed value for debugging.
- Preserve source and interpretation links for fallback lookup.

## Extraction Notes
- Return structured failure:
  - `resource_missing`
  - `resource_malformed`
  - `download_blocked`
  - `extractor_unavailable`

## Verification
- Verified date: 2026-04-24
- Verified scenario: Hubei policy database item where PDF button emitted `//www.hubei.gov.cn/pdbstaticsnull`.
