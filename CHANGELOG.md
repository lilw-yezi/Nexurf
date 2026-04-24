# Changelog

## 1.6.0 - 2026-04-24

### Added
- Added Carrier Automation in Runtime Service for button-triggered document resources.
- `/carrier` now captures likely PDF/OFD/WPS/attachment buttons, `window.open()` resources, inserted frame resources, and malformed resource states.
- Added `docs/carrier-automation.md`.
- Added `quality/smoke/carrier-automation-smoke.mjs` and `npm run test:carrier`.

### Changed
- Package version bumped to `1.6.0`.
- Full test chain now includes carrier automation smoke.

## 1.5.0 - 2026-04-24

### Added
- Expanded scenario library for broader real-world web tasks.
- Added Hubei policy database verified profile and regression case.
- Added profiles for button-triggered document resources, JavaScript pagination search, government information disclosure, attachment lists, office preview, resource failures, institution notices, API docs, package registries, and login/verification walls.
- Added scenario regression index and category files.
- Added `test:scenario` smoke test.

### Changed
- Profile smoke now validates key 1.5 scenario profiles.
- README / README_CN / SKILL now describe the scenario library path.

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
