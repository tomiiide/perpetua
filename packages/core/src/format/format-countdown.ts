import type { Ts } from "../contract/index.js";

/** e.g. funding/expiry countdowns: "04:12" or "1:04:12" past an hour. */
export function formatCountdown(target: Ts, now: Ts): string {
  const totalSeconds = Math.max(0, Math.round((target - now) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}
