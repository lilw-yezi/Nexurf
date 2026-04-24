# Nexurf Profile Authoring Guide

Site profiles are reusable operating knowledge for Nexurf.

## Required frontmatter

```yaml
---
domain: example.com
aliases: [Example, 示例]
updated: 2026-04-24
status: pattern
---
```

## Required sections

- `## Platform Type`
- `## Content Carrier Pattern`
- `## Effective Entry`
- `## Known Traps`
- `## Parameter Preservation Rules`
- `## Extraction Notes`
- `## Verification`

## Rules

- Record verified behavior only.
- Do not record guesses as facts.
- Prefer stable entry paths and repeatable operating patterns.
- Note parameters that must not be trimmed.
- Describe fallback paths when direct extraction fails.

## Validation

Run:

```bash
npm run test:profile
```
