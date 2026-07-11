export interface InfoClient {
  post<T>(body: Record<string, unknown>): Promise<T>;
}

export function createInfoClient(infoUrl: string): InfoClient {
  return {
    async post<T>(body: Record<string, unknown>): Promise<T> {
      const res = await fetch(infoUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`hyperliquid info request failed: ${res.status} ${res.statusText} ${text}`);
      }
      return (await res.json()) as T;
    },
  };
}
