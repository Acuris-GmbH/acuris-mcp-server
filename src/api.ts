/**
 * Thin HTTP layer over the Acuris API.
 *
 * Two hostnames in play:
 *   - api.acuris-geo.com — global API (240+ countries except UK)
 *   - paf.acuris-geo.com — UK Royal Mail PAF (GBR only; licensed)
 *
 * apiHostFor() routes per country so the caller doesn't have to know.
 */

const SATELLITE_HOSTS: Record<string, string> = {
  gbr: "https://paf.acuris-geo.com",
};
export const DEFAULT_HOST = "https://api.acuris-geo.com";

export function apiHostFor(country: string | undefined | null): string {
  const c = (country || "").toLowerCase();
  return SATELLITE_HOSTS[c] || DEFAULT_HOST;
}

export interface AcurisClientOptions {
  apiKey: string;
  userAgent?: string;
  timeoutMs?: number;
}

export class AcurisClient {
  private readonly apiKey: string;
  private readonly userAgent: string;
  private readonly timeoutMs: number;

  constructor(opts: AcurisClientOptions) {
    if (!opts.apiKey) {
      throw new Error(
        "ACURIS_API_KEY is required. Get a free key at https://api.acuris-geo.com/register",
      );
    }
    this.apiKey = opts.apiKey;
    this.userAgent = opts.userAgent || "acuris-mcp-server/0.1.1";
    this.timeoutMs = opts.timeoutMs ?? 15_000;
  }

  async request<T>(
    method: "GET" | "POST",
    path: string,
    {
      country,
      params,
      body,
    }: { country?: string; params?: Record<string, unknown>; body?: unknown } = {},
  ): Promise<T> {
    const host = apiHostFor(country);
    let url = host + path;
    if (params && Object.keys(params).length) {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null || v === "") continue;
        qs.append(k, String(v));
      }
      url += "?" + qs.toString();
    }
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, {
        method,
        signal: ctrl.signal,
        headers: {
          "X-Acuris-Key": this.apiKey,
          "User-Agent": this.userAgent,
          ...(body ? { "Content-Type": "application/json" } : {}),
          Accept: "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await res.text();
      let json: unknown;
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          `Acuris API returned non-JSON (${res.status}): ${text.slice(0, 200)}`,
        );
      }
      if (!res.ok) {
        const err = (json as { error?: string; message?: string }) || {};
        const msg = err.error || err.message || `HTTP ${res.status}`;
        throw new AcurisAPIError(msg, res.status, json);
      }
      return json as T;
    } finally {
      clearTimeout(to);
    }
  }
}

export class AcurisAPIError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "AcurisAPIError";
  }
}
