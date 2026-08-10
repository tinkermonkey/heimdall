# Release process

`@tinkermonkey/heimdall-ui` publishes to npm via a tag-triggered GitHub Actions
workflow (`.github/workflows/release.yml`).

## Cutting a release

1. Make sure `main` is green and up to date locally.
2. Bump the version in `package.json` (`npm version patch|minor|major
   --no-git-tag-version`, or edit by hand). Follow [semver](https://semver.org/).
3. Add a new `## [x.y.z]` section at the top of `CHANGELOG.md` describing the
   change (see existing entries for format — this section becomes the GitHub
   Release body verbatim).
4. Commit: `git commit -am "Release vX.Y.Z"`.
5. Tag and push:
   ```bash
   git tag vX.Y.Z
   git push origin main --tags
   ```
6. The `Release` workflow runs automatically on the tag push:
   - `test` — installs deps, installs Playwright browsers, runs `npm test`
     (visual regression against the committed linux baselines).
   - `release` (needs `test`) — verifies the tag matches
     `package.json`'s version, builds, `npm publish --provenance --access
     public`, then creates a GitHub Release with notes pulled from the
     matching `CHANGELOG.md` section.
7. Watch it in the Actions tab or `gh run watch`. If the tag's version
   doesn't match `package.json`, the release job fails fast before publishing.

## npm auth

2FA stays **enabled** on the npm account (no "bypass 2FA" token). CI instead
authenticates via npm's [Trusted Publisher](https://docs.npmjs.com/trusted-publishers)
(OIDC) — the `release` job already requests `permissions: id-token: write`
and `npm publish --provenance` for this. Once a Trusted Publisher is
configured for the package, npm's CLI detects the OIDC context automatically
and publishes without any token at all.

The `NPM_TOKEN` repo secret is set, but since 2FA is on and this token
doesn't bypass it, npm will reject a publish attempt authenticated with it
alone (it can't answer the interactive OTP prompt). That means **the
`release` job's publish step will fail until a Trusted Publisher is
configured** — expected for any tag pushed before that setup is done. Once
Trusted Publishing is configured, that failure mode goes away and
`NPM_TOKEN` is simply unused; safe to delete it at that point, or leave it
inert.

Trusted Publisher can't be attached to a package that doesn't exist on the
registry yet, so the very first release has to be published by hand from a
logged-in, 2FA-verified local session — see the checklist below.

## First release checklist

- [ ] `tinkermonkey` npm org exists and you're a member.
- [ ] `npm run build && npm pack --dry-run` locally looks sane (no missing
      files, no bloat).
- [ ] Bump the version, update `CHANGELOG.md`, commit, push to `main` — but
      **don't tag yet**.
- [ ] Publish manually (see "Manual first publish" below).
- [ ] Once it's live on npm, configure Trusted Publisher:
      `npmjs.com/package/@tinkermonkey/heimdall-ui/access` → Trusted
      Publisher → GitHub Actions → org `tinkermonkey`, repo `heimdall`,
      workflow `release.yml`.
- [ ] *Now* tag and push (`git tag vX.Y.Z && git push origin main --tags`)
      if you want the release recorded/tagged — note this re-triggers the
      `release` workflow, and since that exact version is already published,
      its `npm publish` step will fail with a harmless 403 ("cannot publish
      over previously published version"). That's expected for this one
      historical tag; every subsequent release goes through the workflow
      normally end to end.

### Manual first publish

```bash
npm login                     # interactive; must be a member of the tinkermonkey org
npm run build                 # sanity check the build before publishing
npm publish --access public   # omit --provenance here — provenance attestation
                               # requires a supported CI/OIDC context and will
                               # fail from a local shell
```

`npm publish` prompts for a one-time password since 2FA is enabled — enter
the code from your authenticator app when asked.
