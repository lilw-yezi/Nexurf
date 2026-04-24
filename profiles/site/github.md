---
domain: github.com
aliases: [GitHub, repository, pull request, issue, commit]
updated: 2026-04-24
status: pattern
---

## Platform Type
- Source code hosting and collaboration platform.

## Content Carrier Pattern
- Most public content is HTML with structured routes for repositories, issues, pull requests, commits, and releases.

## Effective Entry
- Preserve repository owner/name and route path.
- Prefer canonical GitHub URLs.
- Use page inspection for title, metadata, and visible content.

## Known Traps
- Private repositories require login state.
- Diff and file views may lazy-load or truncate large files.
- Raw content should be fetched through the raw URL only when explicitly needed.

## Parameter Preservation Rules
- Preserve branch names, commit SHA, PR number, issue number, and file path.
- Do not collapse route segments.

## Extraction Notes
- HTML extraction is usually enough for page summaries.
- Use raw routes for source file bodies when required.

## Verification
- Verified date: 2026-04-24
- Verified scenario: profile matching and repository route guidance.
