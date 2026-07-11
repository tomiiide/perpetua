/**
 * Minimal ambient shapes for the two runtime globals this venue uses
 * (`fetch`, `WebSocket` — both present in Node 18+). The workspace's
 * tsconfig has no `dom` lib and this package has no `@types/node`
 * dependency, so these are declared locally rather than pulling in a
 * broader type surface.
 */

declare function fetch(url: string, init?: FetchRequestInit): Promise<FetchResponse>;

interface FetchRequestInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

interface FetchResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

declare class WebSocket {
  constructor(url: string);
  static readonly CONNECTING: number;
  static readonly OPEN: number;
  static readonly CLOSING: number;
  static readonly CLOSED: number;
  readonly readyState: number;
  send(data: string): void;
  close(): void;
  addEventListener(type: "open", listener: () => void): void;
  addEventListener(type: "message", listener: (event: { data: string }) => void): void;
  addEventListener(type: "close", listener: () => void): void;
  addEventListener(type: "error", listener: (event: unknown) => void): void;
}
