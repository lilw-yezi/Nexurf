---
domain: attachment-list
aliases: [附件, 附件下载, download list, file attachments]
updated: 2026-04-24
status: pattern
---

## Platform Type
- Pages that publish one or more downloadable files as attachments.

## Content Carrier Pattern
- Body may be short and files carry the real content.
- Attachments may use vague labels such as 附件, 下载, 查看, 正文, PDF版本.

## Effective Entry
- Extract all file-like links and buttons.
- Preserve file label, href, content type, and surrounding text.
- Prefer official attachment over copied text when exact wording matters.

## Known Traps
- File name may be absent or generic.
- Attachment URLs may require referer or cookies.
- Multiple attachments may include forms, appendices, or interpretations rather than main body.

## Parameter Preservation Rules
- Preserve complete download URL and referer page.
- Do not normalize away encoded file names.

## Extraction Notes
- Classify attachments by extension and content type.
- Extract text from PDF/DOCX when supported; otherwise return resource with fallback suggestion.

## Verification
- Verified date: 2026-04-24
- Verified scenario: government policy pages with PDF attachment routes.
