# Nexurf Extractor Boundaries

Nexurf 1.0 intentionally separates direct extraction, conditional extraction, and fallback routing.

## Support Levels

| Content Kind | Support Level | Notes |
|---|---|---|
| HTML | Native | DOM text extraction using article/content/main/body fallback. |
| PDF | Native when environment has PDF libraries | Downloads PDF directly or through browser context, then uses available Python PDF libraries. |
| DOCX | Lightweight native | Uses Python standard library to unzip and read `word/document.xml`. |
| OFD | Fallback | Prefer same-page PDF or HTML alternatives; otherwise return resource URL and next-step guidance. |
| Office non-DOCX | Fallback | Prefer PDF/HTML preview alternatives. |
| Image | Resource fallback | Saves original image resource and returns path for OCR or visual analysis. |
| Canvas/scan | Fallback | Use screenshot or image fallback; OCR is not bundled in 1.0. |

## Extraction Result Fields

- `ok`
- `contentKind`
- `resourceUrl`
- `contentText`
- `extractionConfidence`
- `engine`
- `downloadMode`
- `fallbackUsed`
- `fallbackSuggestion`
- `alternativeResources`

## Principles

- Main page without text is not treated as absence of content.
- Download failure is not treated as absence of resource.
- Missing specialist parser should still produce useful carrier/resource/fallback output.
- Extra heavy dependencies are not required by default.
