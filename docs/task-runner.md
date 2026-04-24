# Nexurf Task Runner

Nexurf 1.7 adds a task-level API on top of Runtime Service, profiles, carrier detection, extraction, and scenario knowledge.

## API

```http
POST /task
Content-Type: application/json

{
  "url": "https://example.com",
  "goal": "inspect-site",
  "limit": 5
}
```

## CLI

```bash
npm run task -- "https://example.com" --goal inspect-site
npm run task -- "https://example.com/list" --goal extract-list --limit 5
```

## Goals

### `inspect-site`
Open the page, match profiles, inspect page snapshot and carrier/resources.

### `extract-page`
Open one page, detect carrier, extract content, and return a summary-ready result.

### `extract-documents`
Open one page and focus on document carriers/resources such as PDF, OFD, WPS, Office, attachments, and viewer resources.

### `extract-list`
Open a list/search page, collect detail links, and run page extraction on each item up to `limit`.

## Task result schema

```json
{
  "ok": true,
  "taskId": "task_xxxxxxxx",
  "goal": "extract-list",
  "input": {},
  "profile": {},
  "steps": [],
  "items": [],
  "resources": [],
  "warnings": [],
  "errors": [],
  "summaryReady": true,
  "summaryInput": "..."
}
```

## Browser port override

If the default Chrome debugging port is stale, set:

```bash
NEXURF_BROWSER_PORT=9333 npm run test
```

or start Chrome with a dedicated profile/port and pass the same port to Nexurf.
