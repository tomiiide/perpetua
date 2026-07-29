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

Publishable packages: `@perpetua/core`, `@perpetua/venues`, `@perpetua/react`. The `examples/*` packages are private and never published (`@perpetua/example-terminal` is also in the changesets `ignore` list).

## One-time setup

- **npm scope**: create the `perpetua` org on npm (https://www.npmjs.com/org/create) or ensure your npm account can publish `@perpetua/*`. All three packages publish with `publishConfig.access: "public"`.
- **NPM_TOKEN**: create an npm automation token (npmjs.com → Access Tokens → Granular/Automation, with publish rights for the `@perpetua` scope) and add it as a repository secret named `NPM_TOKEN` (GitHub → Settings → Secrets and variables → Actions).
- The release workflow uses the default `GITHUB_TOKEN` to open the version PR; enable "Allow GitHub Actions to create and approve pull requests" in Settings → Actions → General if it is disabled.
