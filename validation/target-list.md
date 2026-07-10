# Validation Target List — teams that hand-roll perp order book frontends

Purpose: 25+ interview / design-partner candidates for the "viem of perps" thesis. Priority = how likely they are to adopt a third-party book engine instead of maintaining their own.

Context on the market: ~40% of Hyperliquid DAUs now trade through third-party frontends, and top builders have earned $63M+ in builder-code fees. Every one of these frontends rebuilt orderbook reconciliation, decimal math, and order lifecycle from scratch.

## Tier 1 — Small builder-code teams (best fit: small eng teams, book UI is core, not their moat)

| # | Team | What they build | Why they have the problem | Where to reach |
|---|------|----------------|---------------------------|----------------|
| 1 | Insilico Terminal | Pro execution terminal, HL top-10 builder ($3.3M rev from ~3K users) | Full pro terminal: DOM, TWAP, advanced orders, all hand-rolled | insilicoterminal.com, Discord, X @InsilicoTrading |
| 2 | Dexari | Self-custodial mobile app, 300+ HL markets | Mobile book + order flow in React Native, small Lemniscap-backed team | dexari.com, X @DexariApp |
| 3 | HYENA | HL trading app with social features | Book + positions UI, small team | app.hyena.trade, X |
| 4 | Felix | HL perp interface (usefelix.xyz) | Same stack rebuilt again | usefelix.xyz, X @usefelixxyz, [GitHub](https://github.com/felixprotocol) |
| 5 | Dreamcash | HL frontend + markets layer, top-10 builder | Retail-grade book UI at scale | dreamcash.xyz, X @dreamcash |
| 6 | BasedApp (Based) | Mobile-first HL trading, #2 builder ($15M rev, $44B volume) | High-volume mobile book rendering | app.based.one, X @basedapp |
| 7 | PVP.trade | Telegram-native HL trading, #3 builder ($7.9M rev); acquired Hyperdash | Multiple frontends to maintain post-acquisition | pvp.trade, X @pvptrade |
| 8 | Avy | iOS HL app, QR onboarding | Native mobile book UI | avy.app, X |
| 9 | Kinetiq Markets | HL frontend (markets.xyz) | Book UI rebuild | markets.xyz, X, [GitHub](https://github.com/kinetiq-research) (hosts hl-rs, a Rust HL SDK) |
| 10 | Ventuals | Pre-IPO equity perps on HL (HIP-3) | New market type, same book plumbing | app.ventuals.com, X @ventuals, [GitHub](https://github.com/ventuals) |
| 11 | Miracle | HL trading interface | Book UI rebuild | miracletrade.com, [GitHub](https://github.com/miracle-trade) |
| 12 | Riverrun | Open-source self-custodial RN/Expo HL app | Their book code is public. Read it, then talk to them | [GitHub](https://github.com/sadcoderlabs/riverrun) |

## Tier 2 — Multi-venue terminals and aggregators (strongest thesis fit: venue-agnostic adapters is literally their job)

| # | Team | What they build | Why they have the problem | Where to reach |
|---|------|----------------|---------------------------|----------------|
| 13 | Tealstreet | Multi-exchange terminal (Kraken, Bybit, OKX, HL, 15+ venues) | Maintains N adapters + one book engine, exactly your architecture | tealstreet.io, Discord, X @tealstreet_io, [GitHub](https://github.com/Tealstreet) |
| 14 | Chainpro | Non-custodial terminal: HL, Solana, Base | Multi-venue book normalization | chainpro.xyz, X, [GitHub](https://github.com/Onchain-HQ) |
| 15 | Bullpen | Solana + HL terminal (web, mobile, TG), Ansem co-founded | Two venue integrations, three surfaces | bullpen.fi, X @bullpenfi, [GitHub](https://github.com/BullpenFi) |
| 16 | VOOI | Perp aggregator: Lighter, Aster, HL, Orderly, Ostium | Aggregation = normalize every venue's book and order lifecycle | vooi.io, X @vooi_io, [GitHub](https://github.com/vooi-app) |
| 17 | Tread.fi | Multi-venue perps, HL top-10 builder | Cross-venue execution UI | app.tread.fi, X, [GitHub](https://github.com/tread-labs) |
| 18 | Copin | Copy trading across 20+ perp DEXs | Normalizes positions/fills from 20 venues | app.copin.io, Discord, X @Copin_io, [GitHub](https://github.com/copin-protocol) (interface is open source) |
| 19 | LogX | Orderly-powered multi-chain perp aggregator | Book UI over aggregated liquidity | logx.trade, X @LogX_trade, [GitHub](https://github.com/eugenix-io) (dev org) |
| 20 | RabbitX | Multi-DEX terminal UX | Book + execution layer | app.rabbitx.io, X, [GitHub](https://github.com/rabbitx-io) |
| 21 | Pear Protocol | Pair-trading terminal on Arbitrum | Two-legged order UI, custom book views | pear.garden, X @pear_protocol, [GitHub](https://github.com/pear-protocol) |
| 22 | Hyperdash | HL analytics + execution + copy (now PVP-owned) | Execution terminal + TWAP | hyperdash.com, X |

## Tier 3 — New perp DEXs building frontends in-house (interview for pain, harder sell: may see it as core IP)

| # | Team | What they build | Why talk to them | Where to reach |
|---|------|----------------|------------------|----------------|
| 23 | Pacifica | Solana CLOB, ex-Binance/Jane Street team | Fresh frontend build, fast-listing memecoin perps | app.pacifica.fi, X @pacifica_fi, [GitHub](https://github.com/pacifica-fi) |
| 24 | Decibel | Solana-native CLOB | New book frontend | app.decibel.trade, X |
| 25 | Extended | StarkNet perp DEX, 100x | New venue, new UI | app.extended.exchange, X, [GitHub](https://github.com/x10xchange) |
| 26 | Hibachi | zkVM perps | Small team, full frontend | hibachi.xyz, X, [GitHub](https://github.com/hibachi-xyz) |
| 27 | Nado | Perps on Ink (Kraken L2) | New build on a new L2 | nado.xyz, X, [GitHub](https://github.com/nadohq) |
| 28 | Monday Trade | Monad-native perp DEX | Monad ecosystem is greenfield; several more DEXs coming there | app.monday.trade, X |
| 29 | Ethereal | Ethena-network perps | New venue frontend | app.ethereal.trade, X |

## Tier 4 — Pattern validators (too big to sell to early, but proof the pattern repeats)

Phantom ($20.6M builder rev, 137K users), MetaMask ($6.5M), Rabby, Infinex, Axiom, trade.xyz, 10X. Each embedded an HL perp frontend. Useful as market-size evidence in a deck, not as first customers.

## How to use this list

1. Start with Tier 2. Their entire product is the layer you're abstracting, and they feel the pain per-venue-added. Tealstreet and VOOI first.
2. In Tier 1, read Riverrun's open-source book code before any interviews. It shows you exactly what a small team hand-rolls and where it's buggy.
3. Interview script: "Walk me through how you handle the HL l2Book snapshot + delta stream. What broke? How long did resync logic take? What happens on a sequence gap today?" Listen for time lost, not politeness.
4. Where to find them: Hyperliquid Discord (builder channels), HL builder-code leaderboards (flowscan.xyz/builders, hyperscreener.asxn.xyz/builder-codes, hyperliquid.allium.so/builder-revenue) list every active builder address, which is effectively a live registry of your market.

## Repo evidence (July 2026 scan of public GitHub orgs)

Most frontends in this list are closed source; the public repos show the edges of each stack. What the scan found, strongest signal first:

**Tealstreet** maintained [safe-cex](https://github.com/Tealstreet/safe-cex) (fork of [iam4x/safe-cex](https://github.com/iam4x/safe-cex)), an open TypeScript lib for building trading UIs across CEXs. It is conceptually perpetua, and its flaws are the pitch: parseFloat float math on prices, full re-sort plus cumulative recompute on every book delta, no sequence-gap detection or resync, unmaintained since early 2024. They felt the pain, wrote the library, and abandoned it. First interview.

**Nado** publishes [nado-web-monorepo-snapshot](https://github.com/nadohq/nado-web-monorepo-snapshot), a snapshot of their production trading frontend (rebranded Vertex monorepo: Next.js, wagmi, react-query, bignumber.js, hooks coupled to their own SDK). Best public reference for how teams solve this today: vendor a venue-specific SDK plus coupled react-client. They already sunk the cost, so treat as design-review conversation, not first customer.

**VOOI** ships a unified perps API across HL, Lighter, and Aster with TS bot examples ([vooi-app](https://github.com/vooi-app)) but no client-side book engine. Perpetua is the missing frontend half of their product; partnership angle, not just adoption.

Weak or no public signal: Bullpen, Pear, Pacifica, Extended, Hibachi, and RabbitX expose Python SDKs, contracts, or thin TS examples only; Kinetiq is Rust; Ventuals, Felix, and LogX are contracts-only; Miracle and Tread have zero public repos. Their frontend plumbing exists but is invisible, which is why interviews beat repo archaeology for those teams.

Meta-finding: nobody in this cohort has a maintained venue-agnostic TS book engine. The one attempt (safe-cex) died with float math and no resync. Interview hooks: ask Tealstreet why safe-cex stalled; ask VOOI what their API customers struggle to build client-side.

## Caveats

Contact handles are best-effort and unverified; confirm on each site before outreach. GitHub links were verified against each team's official docs, npm packages, or domains; teams without a link (Insilico, Dexari, HYENA, Dreamcash, Based, PVP.trade, Avy, Hyperdash, Decibel, Monday Trade, Ethereal) have no verifiable public GitHub. Revenue figures are from May 2026 reporting (CoinGecko, The Currency Analytics). The awesome-perp-dex GitHub list (buddies2705/awesome-perp-dex) is the maintained superset if you need more names.
