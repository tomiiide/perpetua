/**
 * Opaque decimal. Backed by scaled bigint or big.js — implementation decision
 * deferred to M0's BookEngine bench (CORE_SPEC.md §12). Never a float.
 */
export type Dec = { readonly __brand: "Dec" };

/** Milliseconds. Venue implementations downscale wire formats (e.g. pod's µs). */
export type Ts = number;

/**
 * Venue-scoped opaque id, globally unique once venue-qualified: "{venueId}:{venueLocalId}".
 * Never parsed, never displayed — display comes from Market fields.
 */
export type MarketId = string & { readonly __brand: "MarketId" };

export type Side = "buy" | "sell";
export type PositionSide = "long" | "short";
