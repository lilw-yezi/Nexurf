# Changelog

## 1.0.0 - 2026-04-24

### Added
- Standard package entrypoints and npm scripts for Runtime Service, Runtime Doctor, Profile Engine, smoke tests, syntax checks, and sensitive scans.
- Automated quality smoke scripts under `quality/smoke/`.
- Runtime API schema documentation and extractor boundary documentation.
- Profile authoring guide and expanded site profile template.
- Regression case template and cases index.
- Additional reusable site profiles for common browsing and extraction patterns.

### Changed
- Nexurf is now organized as `runtime/`, `docs/`, `profiles/`, and `quality/`.
- Runtime naming is standardized around Runtime Service, Runtime Doctor, Profile Engine, and Runtime API.
- Compatibility wrappers remain available for older Skill runners.

### Verified
- Runtime API smoke test covers health, new, info, eval, carrier, extract, scroll, screenshot, and close.
- Sensitive-origin scan passes for the public project directory.
- Profile Engine smoke test passes for all site profiles.
