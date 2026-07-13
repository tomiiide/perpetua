import { createClient } from "@perpetua/core";
import { hyperliquid } from "@perpetua/venues/hyperliquid";

/** One venue, one client — shared across the app (CORE_SPEC.md §5.1). */
export const venue = hyperliquid();
export const client = createClient({ venue });
export const capabilities = venue.market.capabilities();
