# Developer Site Regression Scenarios

## 1. GitHub repository route
- Status: pattern
- Expected: preserve owner, repo, branch/path, issue/PR/release IDs
- Trap: private content requires login state

## 2. API documentation
- Status: pattern
- Expected: extract endpoint/function, parameters, examples, and version
- Trap: SPA docs may require browser context

## 3. Package registry
- Status: pattern
- Expected: extract package metadata and README
- Trap: latest page may differ from version-specific page
