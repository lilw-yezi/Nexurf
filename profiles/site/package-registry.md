---
domain: package-registry
aliases: [npm, PyPI, package registry, crate, Maven, package page]
updated: 2026-04-24
status: pattern
---

## Platform Type
- Package registry pages for libraries and developer tools.

## Content Carrier Pattern
- Metadata is often visible in HTML or JSON APIs.
- README content may be rendered from package metadata.

## Effective Entry
- Extract package name, version, description, install command, repository, license, release date, and README.
- Prefer registry API when available and official.

## Known Traps
- README may be stale relative to package metadata.
- Version pages and latest pages may differ.
- Repository links may point to moved or archived projects.

## Parameter Preservation Rules
- Preserve package scope, version, and registry namespace.

## Extraction Notes
- Use official registry API for structured metadata when possible.
- Use browser context for rendered README when needed.

## Verification
- Verified date: 2026-04-24
- Verified pattern pending broader live regression.
