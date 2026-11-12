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
   - `test` — `npm ci`, `check:skills`, `build` + `check:package`, installs
     the Playwright Chromium browser, then `npm test` (visual regression
     against the committed linux baselines).
   - `release` (needs `test`) — verifies the tag matches `package.json`'s
     version, `npm ci`, builds, upgrades to the latest npm CLI, runs
     `npm publish --provenance --access public`, then creates a GitHub
     Release with notes pulled from the matching `CHANGELOG.md` section.
7. Watch it in the Actions tab or `gh run watch`. If the tag's version
   doesn't match `package.json`, the release job fails before publishing. A
   successful publish logs `+ @tinkermonkey/heimdall-ui@x.y.z`.

If the `test` job fails on `-linux.png` screenshot mismatches rather than a
real regression, that's baseline drift between your local machine and the
`ubuntu-latest` runner — see [Playwright snapshot baselines are per-OS in
CLAUDE.md](CLAUDE.md#playwright-snapshot-baselines-are-per-os) for how to
regenerate them correctly using the `Update Visual Snapshots` workflow, then
commit the fix and retag (delete + recreate the tag, or bump to the next
version and re-tag).

## npm auth

Publishing runs through npm [Trusted Publishing](https://docs.npmjs.com/trusted-publishers)
(OIDC). No npm token is stored in the repo. The Trusted Publisher on
npmjs.com is keyed to org `tinkermonkey`, repo `heimdall`, workflow
`release.yml`; the `release` job requests `permissions: id-token: write`, and
the npm CLI exchanges the GitHub Actions OIDC token for a short-lived publish
token. `--provenance` attaches a signed provenance attestation to every
published version.

Trusted Publishing needs npm CLI 11.5.1 or later, so the job runs
`npm install -g npm@latest` before publishing. 2FA stays enabled on the npm
account; it does not apply to OIDC publishes.

Renaming `release.yml`, moving the repo, or publishing from a different
workflow breaks the match, and npm rejects the publish. Update the Trusted
Publisher settings at `npmjs.com/package/@tinkermonkey/heimdall-ui/access`
first.

## Operational notes

- **Registry lag.** `npm view @tinkermonkey/heimdall-ui version` can trail
  the workflow's `+ @tinkermonkey/heimdall-ui@x.y.z` log line by a couple of
  minutes. The log line is authoritative; wait before treating an old
  `npm view` result as a failed publish.
- **Run stuck "queued".** A CI run can sit "queued" with no jobs, and both
  cancel and rerun are refused. Close and reopen the PR, or push an empty
  commit (`git commit --allow-empty -m "ci: retrigger"`), to start a fresh
  run.
- **Ubuntu apt mirrors unreachable.** The Playwright install step in
  `ci.yml`, `release.yml` and `update-snapshots.yml` runs
  `npx playwright install --with-deps chromium` with a 5-minute timeout. If
  apt can't reach the mirrors, it logs a warning and installs Chromium without
  the system dependencies, which the runner image already provides (#364).

## History

- **v0.5.1** was published by hand from a logged-in local session, because a
  Trusted Publisher can't be attached to a package that doesn't exist on the
  registry yet (`npm login`, `npm run build`, `npm publish --access public`,
  no `--provenance`: provenance needs a CI/OIDC context).
- **v0.5.2** was the first workflow publish. The `NPM_TOKEN` secret it used
  failed with `EOTP` (npm retired 2FA-bypass automation tokens), so
  `release.yml` moved to Trusted Publishing. The secret has since been
  deleted.
- Every release from v0.5.2 on has published through `release.yml`.
