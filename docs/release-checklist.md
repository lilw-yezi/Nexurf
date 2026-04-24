# Nexurf Release Checklist

Run this checklist before publishing a release.

## Required checks
- [ ] `npm run test:syntax`
- [ ] `npm run test:scan`
- [ ] `npm run test:profile`
- [ ] `npm run test:smoke`
- [ ] `npm run test`
- [ ] `git status --short` is clean after commit

## Manual review
- [ ] README quick start is current
- [ ] README_CN quick start is current
- [ ] SKILL.md points to Runtime Doctor and Profile Engine
- [ ] `docs/runtime-api.md` and `docs/runtime-schema.md` match Runtime API behavior
- [ ] `docs/extractor-boundaries.md` matches current extractor capabilities
- [ ] Profile template contains required fields
- [ ] No sensitive origin terms remain in the public project directory

## Release steps
1. Update `package.json` version.
2. Update `CHANGELOG.md`.
3. Run `npm run test`.
4. Commit changes.
5. Tag release: `git tag vX.Y.Z`.
6. Push branch and tag.
