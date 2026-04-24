# Nexurf Regression Cases

## 2026-04-24 example.com runtime smoke
- URL type: stable static HTML
- Requires login: no
- Runtime path: `/health -> /new -> /info -> /eval -> /carrier -> /extract -> /scroll -> /screenshot -> /close`
- Result: passed
- Evidence: automated by `quality/smoke/runtime-smoke.mjs`

## 2026-04-24 generic government viewer pattern
- URL type: reusable profile pattern
- Requires login: depends on host
- Runtime path: carrier detection and PDF/Office/OFD fallback routing
- Result: profile smoke passed
- Profile: `profiles/site/gov-viewer.md`

## 2026-04-24 generic PDF viewer pattern
- URL type: reusable viewer pattern
- Requires login: depends on host
- Runtime path: viewer parameter resolution and PDF extraction route
- Result: profile smoke passed
- Profile: `profiles/site/generic-pdf-viewer.md`

## 2026-04-24 xiaohongshu pattern
- URL type: dynamic social content
- Requires login: often yes for stable access
- Runtime path: real browser context, scroll/screenshot fallback
- Result: profile smoke passed
- Profile: `profiles/site/xiaohongshu.md`

## 2026-04-24 github pattern
- URL type: repository/issue/pull request
- Requires login: only for private content
- Runtime path: HTML extraction or raw URL route for source files
- Result: profile smoke passed
- Profile: `profiles/site/github.md`
