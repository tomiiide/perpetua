import type { Client } from "../../client/index.js";
import type { Trigger } from "../../contract/index.js";
import type { Unwatch } from "../types.js";
import { notImplemented } from "../not-implemented.js";

export interface WatchTriggersOptions {
  onUpdate: (triggers: Trigger[]) => void;
}

export function watchTriggers(client: Client, opts: WatchTriggersOptions): Unwatch {
  void client;
  void opts;
  notImplemented("watchTriggers", "M4");
}
