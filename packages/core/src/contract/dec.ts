/**
 * Prices and sizes cross the public boundary as decimal `string` (wire-native,
 * exact, JSON/state-safe). Exact arithmetic is internal-only (`../decimal`,
 * scaled-bigint); no float ever touches a price or size (CORE_SPEC.md §3, G3).
 */

/** Milliseconds. Venue implementations downscale wire formats (e.g. pod's µs). */
export type Ts = number;

/**
 * Venue-scoped opaque id, globally unique once venue-qualified: "{venueId}:{venueLocalId}".
 * Never parsed, never displayed — display comes from Market fields.
 */
export type MarketId = string & { readonly __brand: "MarketId" };

export type Side = "buy" | "sell";
export type PositionSide = "long" | "short";
