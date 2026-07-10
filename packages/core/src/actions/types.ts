/** Every `get*` action accepts this; default timeoutMs is 10s (CORE_SPEC.md §7). */
export interface ActionOptions {
  timeoutMs?: number;
}

export type Unwatch = () => void;

/** Every subscription-backed `watch*` action reports this via its `onUpdate`. */
export type SubscriptionStatus = "connecting" | "live" | "stale" | "resyncing" | "error";
