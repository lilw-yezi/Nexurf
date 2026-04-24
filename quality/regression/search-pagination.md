# Search and Pagination Regression Scenarios

## 1. Empty-parameter search page
- Status: verified
- Expected: preserve empty query values
- Evidence: Hubei policy database `keyword=&postNumber=`

## 2. JavaScript pagination
- Status: pattern
- Expected: click page controls or call page-owned search function
- Trap: `javascript:;` is not a detail URL

## 3. Form-driven filtering
- Status: pattern
- Expected: record form state, selected filters, sort order, and result count
- Trap: changing filters may reset pagination
