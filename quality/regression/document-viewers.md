# Document Viewer Regression Scenarios

## 1. Button-triggered PDF resource
- Status: verified
- Expected: intercept `window.open`, click button, capture PDF URL
- Evidence: Hubei policy database item 1/2/4/5

## 2. Generic PDF.js viewer
- Status: pattern
- Expected: parse `file`, `filePath`, `url`, or `src` parameter
- Trap: viewer body is not document body

## 3. Office/WPS preview
- Status: pattern
- Expected: capture viewer URL and original file URL separately
- Trap: canvas preview may expose no DOM text
