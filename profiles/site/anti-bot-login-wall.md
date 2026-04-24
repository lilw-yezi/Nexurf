---
domain: anti-bot-login-wall
aliases: [登录墙, 风控, anti-bot, captcha, access denied]
updated: 2026-04-24
status: pattern
---

## Platform Type
- Sites that require login state, human verification, or real browsing context.

## Content Carrier Pattern
- Static responses may show login prompts, access denial, or incomplete content.
- Browser context may still require existing user session.

## Effective Entry
- Detect login wall or anti-bot state before summarizing.
- Use screenshot and page text to report state.
- Do not attempt to bypass access controls.

## Known Traps
- Treating login-wall text as target content.
- Repeated automated actions may trigger rate limits or account risk.
- Captcha/verification requires user action.

## Parameter Preservation Rules
- Preserve original URL and redirect URL.

## Extraction Notes
- Return `login_required`, `verification_required`, or `access_blocked` when appropriate.
- Ask user for manual login only when necessary and safe.

## Verification
- Verified date: 2026-04-24
- Verified pattern based on dynamic/social site guidance.
