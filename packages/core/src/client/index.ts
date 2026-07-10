import type { Client, ClientConfig } from "./types.js";

export type { Client, ClientConfig, ClientOptions } from "./types.js";

const DEFAULT_STALE_AFTER = 5_000;
const DEFAULT_FRAME_BUDGET = 16;

/**
 * `createClient({ venue })` — one venue per client, viem-style (CORE_SPEC.md §5.1).
 *
 * Skeleton only: transport wiring and the internal SubscriptionManager land
 * with the BookEngine in M1. This stub establishes the shape actions and
 * engines are written against.
 */
export function createClient<TCred = unknown>(config: ClientConfig<TCred>): Client<TCred> {
  const { venue, options } = config;

  return {
    venue,
    market: venue.market,
    options: {
      staleAfter: options?.staleAfter ?? DEFAULT_STALE_AFTER,
      frameBudget: options?.frameBudget ?? DEFAULT_FRAME_BUDGET,
    },
    destroy() {
      throw new Error("not implemented: Client.destroy (M1 — SubscriptionManager teardown)");
    },
  };
}
