import type { Market } from "@perpetua/core";
import type { InfoClient } from "./info-client.js";
import { mapMarket } from "./mapping.js";
import type { HlMetaAndAssetCtxs } from "./types.js";

export async function fetchMarkets(info: InfoClient): Promise<Market[]> {
  const [meta, ctxs] = await info.post<HlMetaAndAssetCtxs>({ type: "metaAndAssetCtxs" });
  return meta.universe
    .filter((asset) => !asset.isDelisted)
    .map((asset, i) => mapMarket(asset, ctxs[i]));
}
