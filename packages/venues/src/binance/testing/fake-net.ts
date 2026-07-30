/**
 * Test-only in-memory Binance transport: fake combined-stream websockets plus
 * a fake REST layer, wired to fixture payloads. Stub the `WebSocket` and
 * `fetch` globals with `net.WebSocket` / `net.fetch` so no test can reach the
 * real network.
 */

export interface FakeSentFrame {
  method?: string;
  params?: string[];
  id?: number;
}

export type RestRoute = (params: Record<string, string>) => unknown;

export interface FakeNetOptions {
  /** Messages replayed, per stream, every time a SUBSCRIBE for it arrives. */
  replay?: Record<string, unknown[]>;
  /** REST routes by pathname; return the JSON body, or throw for a 500. */
  rest?: Record<string, RestRoute>;
}

interface FakeResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

const CONNECTING = 0;
const OPEN = 1;
const CLOSING = 2;
const CLOSED = 3;

export function createFakeNet(options: FakeNetOptions = {}) {
  const replay = options.replay ?? {};
  const rest = new Map<string, RestRoute>(Object.entries(options.rest ?? {}));

  class FakeSocket {
    static readonly CONNECTING = CONNECTING;
    static readonly OPEN = OPEN;
    static readonly CLOSING = CLOSING;
    static readonly CLOSED = CLOSED;

    readonly url: string;
    readyState = CONNECTING;
    readonly sent: FakeSentFrame[] = [];
    readonly openListeners: Array<() => void> = [];
    readonly messageListeners: Array<(event: { data: string }) => void> = [];
    readonly closeListeners: Array<() => void> = [];
    readonly errorListeners: Array<(event: unknown) => void> = [];

    constructor(url: string) {
      this.url = url;
      sockets.push(this);
      void Promise.resolve().then(() => {
        if (this.readyState !== CONNECTING) return;
        this.readyState = OPEN;
        for (const fn of [...this.openListeners]) fn();
      });
    }

    addEventListener(type: "open", listener: () => void): void;
    addEventListener(type: "message", listener: (event: { data: string }) => void): void;
    addEventListener(type: "close", listener: () => void): void;
    addEventListener(type: "error", listener: (event: unknown) => void): void;
    addEventListener(type: string, listener: unknown): void {
      if (type === "open") this.openListeners.push(listener as () => void);
      else if (type === "message") this.messageListeners.push(listener as (event: { data: string }) => void);
      else if (type === "close") this.closeListeners.push(listener as () => void);
      else if (type === "error") this.errorListeners.push(listener as (event: unknown) => void);
    }

    send(raw: string): void {
      if (this.readyState !== OPEN) {
        throw new Error(`send on non-open fake socket (readyState ${this.readyState})`);
      }
      const frame = JSON.parse(raw) as FakeSentFrame;
      this.sent.push(frame);
      if (frame.method === "SUBSCRIBE") {
        for (const stream of frame.params ?? []) {
          for (const data of replay[stream] ?? []) this.emit(stream, data);
        }
      }
    }

    close(): void {
      if (this.readyState === CLOSED) return;
      this.readyState = CLOSED;
      for (const fn of [...this.closeListeners]) fn();
    }

    /** Server-side push of one combined-stream frame. */
    emit(stream: string, data: unknown): void {
      this.emitRaw(JSON.stringify({ stream, data }));
    }

    /** Server-side raw frame (subscribe acks, malformed payloads). */
    emitRaw(raw: string): void {
      if (this.readyState !== OPEN) return;
      for (const fn of [...this.messageListeners]) fn({ data: raw });
    }

    /** Server-side unexpected close. */
    drop(): void {
      this.close();
    }

    subscribedStreams(): string[] {
      return this.sent.filter((f) => f.method === "SUBSCRIBE").flatMap((f) => f.params ?? []);
    }
  }

  const sockets: InstanceType<typeof FakeSocket>[] = [];
  const restCalls: Array<{ path: string; params: Record<string, string> }> = [];

  const fetchImpl = async (url: string): Promise<FakeResponse> => {
    const [beforeQuery = "", query = ""] = url.split("?");
    const path = beforeQuery.replace(/^[a-z]+:\/\/[^/]*/i, "");
    const params: Record<string, string> = {};
    for (const pair of query.split("&")) {
      if (!pair) continue;
      const eq = pair.indexOf("=");
      const key = decodeURIComponent(eq === -1 ? pair : pair.slice(0, eq));
      params[key] = decodeURIComponent(eq === -1 ? "" : pair.slice(eq + 1));
    }
    restCalls.push({ path, params });
    const route = rest.get(path);
    if (!route) {
      return {
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({}),
        text: async () => `no fake route for ${path}`,
      };
    }
    let body: unknown;
    try {
      body = route(params);
    } catch (e) {
      return {
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => ({}),
        text: async () => String(e),
      };
    }
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => body,
      text: async () => JSON.stringify(body),
    };
  };

  return {
    WebSocket: FakeSocket,
    fetch: fetchImpl,
    sockets,
    restCalls,
    setRoute(path: string, route: RestRoute): void {
      rest.set(path, route);
    },
    socketFor(url: string): InstanceType<typeof FakeSocket> | undefined {
      return sockets.filter((s) => s.url === url).at(-1);
    },
  };
}

export type FakeNet = ReturnType<typeof createFakeNet>;
export type FakeSocketHandle = FakeNet["sockets"][number];

/** Drain enough microtask rounds for socket-open, replay, and fetch chains to settle. */
export async function settle(rounds = 10): Promise<void> {
  for (let i = 0; i < rounds; i++) await Promise.resolve();
}
