# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Releases: changesets-driven; flow and one-time setup in RELEASING.md. Publishable packages are `@perpkit/core`, `@perpkit/venues`, `@perpkit/react`; `examples/*` stay private and are in the changesets ignore list.
- CI: `.github/workflows/ci.yml` runs `pnpm build`, `pnpm typecheck`, `pnpm test` on PRs and pushes to main (build first: workspace `exports` resolve types from `dist/`).
- Venue behavioral contracts (BookEngine, conformance bar, perf budgets) live in CORE_SPEC.md; the conformance suite is `@perpkit/core/testing` (`runConformance`), run against fixture-fed venues, never live APIs.
- Venue tests stub the `WebSocket`/`fetch` globals with the in-memory transport in `packages/venues/src/binance/testing/fake-net.ts` fed by captured payloads in `testing/fixtures.ts`; reuse that harness for new venues.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
