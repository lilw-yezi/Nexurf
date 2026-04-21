# Nexurf

Nexurf is an agent-native web and browser skill for source discovery, dynamic page access, real browser interaction, login-state reuse, multi-format content extraction, and reusable site knowledge accumulation.

## Overview

Nexurf is designed for agent workflows that need more than static page fetching. It provides a structured way to choose the right access path for a task, connect to a real browser environment when necessary, interact with dynamic pages, and extract content from complex carriers such as iframes, viewers, PDFs, Office documents, and images.

Rather than treating web access as a collection of one-off scripts, Nexurf is organized as a reusable skill/runtime foundation for repeatable agent work.

## Capabilities

- Discover official sources and stable entry points
- Read static and dynamically rendered pages
- Reuse real browser context and login state when required
- Perform browser actions such as navigation, click, scroll, upload, and snapshot
- Detect content carriers including iframe, embed, viewer, PDF, Office files, and images
- Route extraction by carrier type and content format
- Accumulate reusable site profiles for future tasks

## Repository Structure

```text
.
├── SKILL.md
├── README.md
├── LICENSE
├── .gitignore
├── references/
│   ├── browser-api.md
│   ├── content-extraction.md
│   └── site-profiles/
└── scripts/
    ├── browser-bridge.mjs
    ├── check-runtime.mjs
    └── match-profile.mjs
```

## Core Principles

- Prefer the shortest valid path to the task goal
- Prefer official and first-hand sources for verification work
- Preserve full URLs and parameters by default
- Treat dynamic pages and embedded resources as first-class content carriers
- Keep site knowledge reusable instead of hard-coding one-off logic

## Quick Start

Run the runtime check before using the browser bridge:

```bash
node scripts/check-runtime.mjs
```

This check verifies:
- Node.js availability
- browser remote debugging availability
- bridge availability
- existing site profiles

## Included Components

### `SKILL.md`
Defines the operating guidance for using Nexurf in agent workflows, including path selection, browser usage, extraction strategy, and site-profile usage.

### `scripts/check-runtime.mjs`
Validates the local runtime environment and ensures the Nexurf bridge is available.

### `scripts/browser-bridge.mjs`
Provides the browser-side bridge for page creation, navigation, inspection, interaction, carrier detection, extraction, and cleanup.

### `scripts/match-profile.mjs`
Matches a task or site description against existing site profiles.

### `references/browser-api.md`
Documents the bridge endpoints, action boundaries, and response conventions.

### `references/content-extraction.md`
Documents the carrier-detection and extraction-routing model used for multi-format content retrieval.

### `references/site-profiles/`
Stores reusable site-specific operating knowledge, such as stable entry paths, known pitfalls, and parameter preservation rules.

## Typical Use Cases

- Official-source verification
- Dynamic page reading
- Browser-based interaction workflows
- Embedded document extraction
- Multi-format content retrieval
- Reusable site operational knowledge accumulation

## Notes

Nexurf is intended to be used as a reusable agent skill and runtime foundation. It is not positioned as a one-off scraping template or a single-site automation script.
