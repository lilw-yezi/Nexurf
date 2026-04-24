# Content Site Regression Scenarios

## 1. News article
- Status: pattern
- Expected: extract title, source, date, body, and canonical URL
- Trap: ads and recommendations pollute body text

## 2. Institution notice with attachments
- Status: pattern
- Expected: extract body and attachment list
- Trap: attachment may contain the real form or appendix

## 3. Multi-page article
- Status: pattern
- Expected: detect and preserve pagination links
- Trap: first page may not contain complete article
