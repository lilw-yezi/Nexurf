# Nexurf Runtime Schema

This document defines the stable response shapes for Nexurf Runtime API 1.0.

## Common Success Response

```json
{
  "ok": true
}
```

Endpoint-specific fields may be added beside `ok`.

## Common Error Response

```json
{
  "ok": false,
  "error": {
    "code": "runtime_service_error",
    "message": "human readable message",
    "details": null
  }
}
```

## Error Codes

| Code | Meaning |
|---|---|
| `bad_request` | Required request parameter is missing or invalid. |
| `page_not_found` | The requested page context does not exist. |
| `runtime_service_error` | Runtime Service failed while executing the action. |
| `eval_failed` | Page JavaScript evaluation failed. |
| `tap_failed` | DOM click failed. |
| `click_at_failed` | Browser-level click failed. |
| `snap_failed` | Screenshot capture failed. |
| `extractor_not_implemented` | Carrier type is known but no extractor is implemented. |

## Page Snapshot

```json
{
  "title": "Example Domain",
  "url": "https://www.example.com/",
  "readyState": "complete"
}
```

## `GET /health`

```json
{
  "ok": true,
  "service": "nexurf-runtime-service",
  "port": 3460,
  "browser": {
    "connected": true,
    "port": 9222,
    "connecting": false,
    "lastConnectionAttemptAt": "2026-04-24T00:00:00.000Z",
    "lastConnectionError": null
  },
  "pages": {
    "total": 0,
    "usable": 0,
    "stale": 0,
    "detached": 0,
    "items": []
  }
}
```

## `GET/POST /new`

Request:
- Query: `url`
- JSON body: `{ "url": "https://example.com" }`

Response:
```json
{
  "ok": true,
  "pageId": "page_xxxxxxxx",
  "page": {
    "title": "Example Domain",
    "url": "https://www.example.com/",
    "readyState": "complete"
  }
}
```

## `GET/POST /navigate`

Request:
- Query: `target` or `pageId`, plus `url`
- JSON body: `{ "pageId": "page_xxxxxxxx", "url": "https://example.com" }`

Response:
```json
{
  "ok": true,
  "navigation": {},
  "page": {}
}
```

## `GET /info`

Response:
```json
{
  "ok": true,
  "pageId": "page_xxxxxxxx",
  "page": {}
}
```

## `POST /eval`

Response:
```json
{
  "ok": true,
  "pageId": "page_xxxxxxxx",
  "result": "Example Domain"
}
```

## Carrier Result

```json
{
  "contentKind": "html",
  "carrierKind": "html",
  "resourceUrl": "https://example.com/file.pdf",
  "viewerUrl": "https://example.com/viewer.html?file=...",
  "alternativeResources": []
}
```

## `GET /carrier`

Response:
```json
{
  "ok": true,
  "pageId": "page_xxxxxxxx",
  "carrier": {}
}
```

## Extraction Result

```json
{
  "ok": true,
  "contentKind": "html",
  "resourceUrl": "https://www.example.com/",
  "contentText": "Example Domain ...",
  "extractionConfidence": "medium",
  "engine": null,
  "downloadMode": null,
  "fallbackUsed": null,
  "fallbackSuggestion": null
}
```

## `GET /extract`

Response:
```json
{
  "ok": true,
  "pageId": "page_xxxxxxxx",
  "carrier": {},
  "extraction": {}
}
```

## `GET /screenshot`

Response with file:
```json
{
  "ok": true,
  "pageId": "page_xxxxxxxx",
  "saved": "/tmp/file.png"
}
```

## `GET /close`

```json
{
  "ok": true,
  "pageId": "page_xxxxxxxx",
  "closed": true
}
```

## Carrier Automation Fields

Nexurf 1.6 adds these optional carrier fields:

```json
{
  "carrierKind": "interactive",
  "resourceIssue": null,
  "interactiveDocumentResources": {
    "buttons": [],
    "captured": [],
    "error": null
  },
  "alternativeResources": [
    {
      "text": "PDF版本",
      "resourceUrl": "https://example.com/doc.pdf",
      "source": "window.open",
      "kind": "pdf",
      "issue": null
    }
  ]
}
```

Known `issue` values include:

- `resource_missing`
- `resource_malformed`
