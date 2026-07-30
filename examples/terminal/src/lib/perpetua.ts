import { createClient } from "@perpkit/core";
import { hyperliquid } from "@perpkit/venues/hyperliquid";

/** One venue, one client — shared across the app (CORE_SPEC.md §5.1). */
const venue = hyperliquid();
export const client = createClient({ venue });
export const capabilities = venue.market.capabilities();
