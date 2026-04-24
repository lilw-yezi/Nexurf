# Failure Mode Regression Scenarios

## 1. Malformed resource URL
- Status: verified
- Expected: classify as `resource_malformed`
- Evidence: Hubei policy database emitted `//www.hubei.gov.cn/pdbstaticsnull`

## 2. False empty detail page
- Status: verified
- Expected: inspect document buttons/viewers before concluding absence
- Evidence: Hubei detail pages show metadata while body is in PDF

## 3. Login or verification wall
- Status: pattern
- Expected: report `login_required` or `verification_required`
- Trap: login prompt is not target content
