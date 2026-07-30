# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Releases: changesets-driven; flow and one-time setup in RELEASING.md. Publishable packages are `@perpetua/core`, `@perpetua/venues`, `@perpetua/react`; `examples/*` stay private and are in the changesets ignore list.
- CI: `.github/workflows/ci.yml` runs `pnpm build`, `pnpm typecheck`, `pnpm test` on PRs and pushes to main (build first: workspace `exports` resolve types from `dist/`).

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
