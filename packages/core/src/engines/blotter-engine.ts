/**
 * Internal only — instantiated by the account watch-actions (M4). Owns
 * optimistic-insert strategy selection by `Capabilities.orderIdentity`,
 * fill/ack reconciliation (including fill-before-ack, cancel-ack-without-ack,
 * idempotent-by-fill-id), and the order status state machine
 * (CORE_SPEC.md §5.6).
 */
export class BlotterEngine {
  constructor() {
    throw new Error("not implemented: BlotterEngine (M4)");
  }
}
