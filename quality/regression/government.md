# Government Regression Scenarios

## 1. Hubei policy database search and detail
- Status: verified
- Entry: full search URL with empty parameters
- Expected: list extraction, metadata extraction, PDF button capture
- Evidence: `hubei-pdb-top5.md`

## 2. Government information disclosure attachment detail
- Status: pattern
- Expected: extract metadata first, then resolve attachment or viewer body
- Trap: index page may not contain full text

## 3. County/city normative document with interpretation links
- Status: pattern
- Expected: preserve main document and interpretation links separately
- Trap: interpretation links are not the policy body
