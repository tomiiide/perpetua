# Releasing

Releases are automated with [changesets](https://github.com/changesets/changesets) and GitHub Actions.

## Flow

1. Every PR that changes a publishable package should include a changeset:

   ```sh
   pnpm changeset
   ```

   Pick the affected packages, a bump type (patch/minor/major), and write a short summary. Commit the generated file in `.changeset/`.

2. When changesets land on `main`, the [release workflow](.github/workflows/release.yml) opens (or updates) a "Version Packages" PR that bumps versions and updates changelogs.

3. Merging that PR publishes the bumped packages to npm and creates git tags.

Publishable packages: `@perpkit/core`, `@perpkit/venues`, `@perpkit/react`. The `examples/*` packages are private and never published (`@perpkit/example-terminal` is also in the changesets `ignore` list).

## One-time setup

Publishing uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) (OIDC). CI authenticates via a short-lived OIDC token; there is no `NPM_TOKEN` secret.

- **npm scope**: ensure your npm account can publish `@perpkit/*`. All three packages publish with `publishConfig.access: "public"`.
- **Bootstrap publish**: a trusted publisher can only be configured on a package that already exists on npm, so the first version of each package (`@perpkit/core`, `@perpkit/venues`, `@perpkit/react`) must be published manually once (`npm publish` from each package dir after `pnpm build`).
- **Trusted publisher**: for each package on npmjs.com (package → Settings → Trusted Publisher), add a GitHub Actions publisher with organization/user `tomiiide`, repository `perpetua`, and workflow filename `release.yml` (the filename only, not the full `.github/workflows/` path). Leave environment empty unless the workflow specifies one.
- The release workflow uses the default `GITHUB_TOKEN` to open the version PR; enable "Allow GitHub Actions to create and approve pull requests" in Settings → Actions → General if it is disabled.

Notes:

- The workflow grants `id-token: write` and upgrades npm to latest before publishing; trusted publishing requires npm >= 11.5.1 and Node >= 22.14 (the workflow uses Node 24, whose bundled npm supports the OIDC handshake — older bundled npm versions fail with a misleading `E404`/"access token expired" on scoped packages).
- With trusted publishing, npm generates and publishes [provenance attestations](https://docs.npmjs.com/generating-provenance-statements) by default; no `--provenance` flag or config is needed.
