/**
 * Typed venue errors (CORE_SPEC.md §7). Only the two needed today are defined;
 * SequenceGapError / RateLimitError / TimeoutError / OrderRejectedError land
 * with the transport and account layers (M1+).
 */

/** Base for every error a venue raises across the public boundary. */
export class VenueError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "VenueError";
  }
}

/** A request the venue can reject statically: unsupported subscription, unknown market, out-of-domain resolution. */
export class ValidationError extends VenueError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
