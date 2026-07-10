import type { Client } from "../../client/index.js";
import type { Position } from "../../contract/index.js";
import type { Unwatch } from "../types.js";
import { notImplemented } from "../not-implemented.js";

export interface WatchPositionsOptions {
  onUpdate: (positions: Position[]) => void;
}

export function watchPositions(client: Client, opts: WatchPositionsOptions): Unwatch {
  void client;
  void opts;
  notImplemented("watchPositions", "M4 — BlotterEngine");
}
