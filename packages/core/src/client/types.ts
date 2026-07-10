import type { MarketDataVenue, Venue } from "../contract/index.js";

export interface ClientOptions {
  /** ms with no heartbeat before a subscription-backed action reports `stale`. Default 5000. */
  staleAfter?: number;
  /** max ms between coalesced emissions from watch-actions. Default 16. */
  frameBudget?: number;
  reconnect?: { minMs: number; maxMs: number; jitter: boolean };
}

export interface ClientConfig<TCred = unknown> {
  venue: Venue<TCred>;
  options?: ClientOptions;
}

/**
 * Bound to exactly one venue, like a viem client is bound to one chain.
 * Owns transport/poll-loop lifecycle and subscription refcounting for that
 * venue; engines and actions are the only consumers (CORE_SPEC.md §5.1).
 */
export interface Client<TCred = unknown> {
  readonly venue: Venue<TCred>;
  readonly market: MarketDataVenue;
  readonly options: Required<Pick<ClientOptions, "staleAfter" | "frameBudget">>;
  destroy(): void;
}
