/** Shared stub thrower so every action stub fails identically until its milestone lands. */
export function notImplemented(action: string, milestone: string): never {
  throw new Error(`not implemented: ${action} (${milestone})`);
}
