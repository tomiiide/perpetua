export interface RestClient {
  get<T>(path: string, params?: Record<string, string>): Promise<T>;
}

export function createRestClient(baseUrl: string): RestClient {
  return {
    async get<T>(path: string, params?: Record<string, string>): Promise<T> {
      const query = params
        ? `?${Object.entries(params)
            .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
            .join("&")}`
        : "";
      const res = await fetch(`${baseUrl}${path}${query}`);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`binance rest request failed: ${res.status} ${res.statusText} ${text}`);
      }
      return (await res.json()) as T;
    },
  };
}
