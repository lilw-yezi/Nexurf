# Nexurf Scenario Index

## Government and Policy
- Hubei policy database default search top five: verified, see `hubei-pdb-top5.md`.
- Government information disclosure detail page with attachment: pattern.
- County/city normative document detail with source-site fallback: pattern.

## Document Viewers and Resources
- Button-triggered PDF/WPS/OFD resource: verified, see Hubei case.
- Generic PDF.js viewer with `file=` or `filePath=` parameter: pattern.
- Office/WPS preview without direct DOM text: pattern.

## Search and Pagination
- Empty query parameter search page: verified, see Hubei case.
- JavaScript pagination with `javascript:;` links: pattern.
- Form-driven filter and sort state: pattern.

## Content Sites
- News article body extraction: pattern.
- Institution notice with attachment: pattern.
- Multi-page article or paginated body: pattern.

## Developer Sites
- GitHub repository/issue/pull request/release: pattern.
- API documentation with code blocks and version selector: pattern.
- Package registry with metadata and README: pattern.

## Dynamic and Restricted Access
- Social/dynamic content requiring browser context: pattern.
- Login wall or verification-required page: pattern.
- Screenshot/scroll fallback where DOM text is incomplete: pattern.

## Failure Modes
- Malformed document resource, such as `pdbstaticsnull`: verified, see Hubei case.
- Download blocked by referer/cookie requirement: pattern.
- False empty page where metadata exists but body carrier is external: verified, see Hubei case.
