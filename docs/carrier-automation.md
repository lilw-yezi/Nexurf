# Nexurf Carrier Automation

Nexurf 1.6 adds automatic carrier discovery for document resources exposed through page interactions.

## What it detects

- Buttons or clickable elements labelled PDF, OFD, WPS, Word, attachment, download, body, full text, preview, or version.
- `window.open()` calls triggered by those elements.
- Newly inserted iframe/frame/embed/object resources.
- Navigation triggered by document buttons.
- Malformed resources such as `null`, `undefined`, or `pdbstaticsnull`.

## Runtime behavior

`/carrier` now returns:

- `carrierKind: "interactive"` when an interactive document resource is promoted as the primary resource.
- `resourceUrl` promoted from captured document resources when valid.
- `resourceIssue` when the primary resource is missing or malformed.
- `interactiveDocumentResources.buttons` for candidate buttons.
- `interactiveDocumentResources.captured` for captured resources.
- `alternativeResources[].issue` for malformed or missing resources.

## Example

A detail page with:

```html
<button id="pdf-print" onclick="window.open('/doc.pdf')">PDF版本</button>
```

will be classified as an interactive PDF carrier, with `/doc.pdf` resolved against the page URL.

## Safety

Carrier Automation only clicks likely document-resource controls and limits the number of candidate elements. It does not attempt to bypass login, captcha, or access controls.

## Known limits

- Some sites require cookies, referer, or user login to download the captured resource.
- Some buttons perform destructive or state-changing actions if labels are ambiguous; profiles should document those traps.
- OFD and Office resources may still need fallback extraction.
