export interface HlSubscriptionMsg {
  type: string;
  coin?: string;
  interval?: string;
}

export type HlWsHandler = (data: unknown) => void;

const MIN_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 30_000;
const PING_INTERVAL_MS = 50_000;

function subKey(sub: HlSubscriptionMsg): string {
  return `${sub.type}:${sub.coin ?? ""}:${sub.interval ?? ""}`;
}

/** Reverse-maps a pushed message's channel + payload back to the subscription key that requested it. */
function dataKey(channel: string, data: unknown): string | null {
  switch (channel) {
    case "l2Book": {
      const coin = (data as { coin?: string }).coin;
      return coin ? subKey({ type: "l2Book", coin }) : null;
    }
    case "trades": {
      const first = (data as Array<{ coin?: string }>)[0];
      return first?.coin ? subKey({ type: "trades", coin: first.coin }) : null;
    }
    case "candle": {
      const d = data as { s?: string; i?: string };
      return d.s && d.i ? subKey({ type: "candle", coin: d.s, interval: d.i }) : null;
    }
    case "activeAssetCtx": {
      const coin = (data as { coin?: string }).coin;
      return coin ? subKey({ type: "activeAssetCtx", coin }) : null;
    }
    default:
      return null;
  }
}

interface HlChannel {
  subscription: HlSubscriptionMsg;
  handlers: Set<HlWsHandler>;
}

/**
 * One shared, lazily-connected websocket per venue instance, multiplexed
 * across every subscribe() call (CORE_SPEC.md §7 reconnect policy:
 * exponential backoff 0.5s -> 30s cap, jittered, resubscribe-all on reconnect).
 */
export class HlWsClient {
  private readonly url: string;
  private ws: WebSocket | null = null;
  private readonly channels = new Map<string, HlChannel>();
  private backoffMs = MIN_BACKOFF_MS;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;

  constructor(url: string) {
    this.url = url;
  }

  subscribe(subscription: HlSubscriptionMsg, handler: HlWsHandler): () => void {
    const key = subKey(subscription);
    let channel = this.channels.get(key);
    const isNewChannel = !channel;
    if (!channel) {
      channel = { subscription, handlers: new Set() };
      this.channels.set(key, channel);
    }
    channel.handlers.add(handler);

    if (isNewChannel) {
      this.ensureConnected();
      this.send({ method: "subscribe", subscription });
    }

    return () => {
      const ch = this.channels.get(key);
      if (!ch) return;
      ch.handlers.delete(handler);
      if (ch.handlers.size === 0) {
        this.channels.delete(key);
        this.send({ method: "unsubscribe", subscription: ch.subscription });
        if (this.channels.size === 0) this.disconnectIdle();
      }
    };
  }

  private ensureConnected(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.addEventListener("open", () => {
      this.backoffMs = MIN_BACKOFF_MS;
      this.startPing();
      for (const channel of this.channels.values()) {
        this.send({ method: "subscribe", subscription: channel.subscription });
      }
    });

    ws.addEventListener("message", (event) => {
      this.handleMessage(event.data);
    });

    ws.addEventListener("close", () => {
      this.stopPing();
      this.scheduleReconnect();
    });

    ws.addEventListener("error", () => {
      ws.close();
    });
  }

  private disconnectIdle(): void {
    this.stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.backoffMs = MIN_BACKOFF_MS;
    this.ws?.close();
    this.ws = null;
  }

  private send(payload: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => this.send({ method: "ping" }), PING_INTERVAL_MS);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.channels.size === 0) return;
    const jitter = Math.random() * this.backoffMs * 0.5;
    const delay = Math.min(this.backoffMs, MAX_BACKOFF_MS) + jitter;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.backoffMs = Math.min(this.backoffMs * 2, MAX_BACKOFF_MS);
      this.ensureConnected();
    }, delay);
  }

  private handleMessage(raw: string): void {
    let msg: { channel?: string; data?: unknown };
    try {
      msg = JSON.parse(raw) as { channel?: string; data?: unknown };
    } catch {
      return;
    }
    if (!msg.channel || msg.channel === "pong" || msg.channel === "subscriptionResponse") return;
    const key = dataKey(msg.channel, msg.data);
    if (!key) return;
    const channel = this.channels.get(key);
    if (!channel) return;
    for (const handler of channel.handlers) handler(msg.data);
  }
}
