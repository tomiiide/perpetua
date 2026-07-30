export type BnWsHandler = (data: unknown) => void;

const MIN_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 30_000;

interface BnChannel {
  handlers: Set<BnWsHandler>;
}

/**
 * One shared, lazily-connected websocket per venue instance, multiplexed
 * across every subscribe() call (CORE_SPEC.md §7 reconnect policy:
 * exponential backoff 0.5s -> 30s cap, jittered, resubscribe-all on reconnect).
 *
 * Uses Binance's combined-stream endpoint (`/stream`): a channel is a stream
 * name (e.g. "btcusdt@aggTrade") which doubles as the routing key, and every
 * push arrives wrapped as `{ stream, data }`. Keepalive is protocol-level:
 * Binance sends ping frames and the transport auto-replies with pong frames,
 * so there is no app-level ping (unlike Hyperliquid).
 */
export class BinanceWsClient {
  private readonly url: string;
  private ws: WebSocket | null = null;
  private readonly channels = new Map<string, BnChannel>();
  private backoffMs = MIN_BACKOFF_MS;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private nextId = 1;

  constructor(url: string) {
    this.url = url;
  }

  subscribe(stream: string, handler: BnWsHandler): () => void {
    let channel = this.channels.get(stream);
    const isNewChannel = !channel;
    if (!channel) {
      channel = { handlers: new Set() };
      this.channels.set(stream, channel);
    }
    channel.handlers.add(handler);

    if (isNewChannel) {
      this.ensureConnected();
      this.send({ method: "SUBSCRIBE", params: [stream], id: this.nextId++ });
    }

    return () => {
      const ch = this.channels.get(stream);
      if (!ch) return;
      ch.handlers.delete(handler);
      if (ch.handlers.size === 0) {
        this.channels.delete(stream);
        this.send({ method: "UNSUBSCRIBE", params: [stream], id: this.nextId++ });
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
      const params = [...this.channels.keys()];
      if (params.length > 0) {
        this.send({ method: "SUBSCRIBE", params, id: this.nextId++ });
      }
    });

    ws.addEventListener("message", (event) => {
      this.handleMessage(event.data);
    });

    ws.addEventListener("close", () => {
      this.scheduleReconnect();
    });

    ws.addEventListener("error", () => {
      // close() on a non-OPEN socket re-fires "error" (undici) — recursion guard
      if (ws.readyState === WebSocket.OPEN) ws.close();
    });
  }

  private disconnectIdle(): void {
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
    let msg: { stream?: string; data?: unknown };
    try {
      msg = JSON.parse(raw) as { stream?: string; data?: unknown };
    } catch {
      return;
    }
    // Combined-stream pushes carry `stream`; SUBSCRIBE/UNSUBSCRIBE acks are `{ result, id }` and skipped here.
    if (!msg.stream) return;
    const channel = this.channels.get(msg.stream);
    if (!channel) return;
    for (const handler of channel.handlers) handler(msg.data);
  }
}
