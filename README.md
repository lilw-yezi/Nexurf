<div align="center">

# Nexurf

**An agent-native browser skill for dynamic interaction, content extraction, and reusable site knowledge.**

[中文说明](./README_CN.md) · [MIT License](./LICENSE)

</div>

---

## Overview

Nexurf is designed for agent workflows that need reliable browser-based access to real websites and dynamic content. It provides a structured way to connect to a live browser environment, interact with pages, and extract content from complex carriers such as iframes, viewers, PDFs, Office documents, and images.

Nexurf is organized as a reusable skill/runtime foundation for repeatable agent workflows.

## Highlights

- Discover official sources and stable entry points
- Read static and dynamically rendered pages
- Reuse real browser context and login state when required
- Perform browser actions such as navigation, click, scroll, upload, and snapshot
- Detect content carriers including iframe, embed, viewer, PDF, Office files, and images
- Route extraction by carrier type and content format
- Accumulate reusable site profiles for future tasks

## Usage

Nexurf requires a locally running Chromium-based browser with remote debugging enabled. Before using Nexurf, complete the setup below.

### 1. Prepare a supported browser
Use a Chromium-based browser such as:
- Google Chrome
- Chrome Canary
- Chromium

### 2. Enable remote debugging
Start the browser with a remote debugging port enabled.

Example on macOS:

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

If the browser is already running, fully quit it first and then restart it with the flag above.

### 3. Confirm browser access
After the browser starts, open:

```text
chrome://inspect/#remote-debugging
```

Confirm that remote debugging is enabled for the current browser instance.

### 4. Keep the browser session alive
Keep the browser open while Nexurf is in use. Nexurf relies on the live browser session for page access, interaction, and login-state reuse.

### 5. Use Nexurf in your agent environment
Once the browser is ready, Nexurf can be used from an agent environment that supports local skill execution and browser bridge access.

## Repository Structure

```text
.
├── SKILL.md
├── README.md
├── README_CN.md
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

## License

This project is released under the [MIT License](./LICENSE).
