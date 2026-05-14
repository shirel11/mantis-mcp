import { readFile } from "node:fs/promises";
import { basename } from "node:path";

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue | QueryValue[]>;

export class MantisApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: unknown,
    public readonly url: string,
  ) {
    const bodyStr =
      typeof body === "string" ? body : JSON.stringify(body);
    super(
      `Mantis API ${status} ${statusText} for ${url}: ${bodyStr}`,
    );
    this.name = "MantisApiError";
  }
}

export interface MantisAttachmentInput {
  path: string;
  name?: string;
}

export interface MantisAttachmentPayload {
  name: string;
  content: string;
}

export class MantisClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
  ) {}

  async get<T = unknown>(path: string, query?: QueryParams): Promise<T> {
    return this.request<T>("GET", path, { query });
  }

  async post<T = unknown>(
    path: string,
    body?: unknown,
    query?: QueryParams,
  ): Promise<T> {
    return this.request<T>("POST", path, { body, query });
  }

  async patch<T = unknown>(
    path: string,
    body?: unknown,
    query?: QueryParams,
  ): Promise<T> {
    return this.request<T>("PATCH", path, { body, query });
  }

  async put<T = unknown>(
    path: string,
    body?: unknown,
    query?: QueryParams,
  ): Promise<T> {
    return this.request<T>("PUT", path, { body, query });
  }

  async delete<T = unknown>(path: string, query?: QueryParams): Promise<T> {
    return this.request<T>("DELETE", path, { query });
  }

  static async readAttachments(
    files: MantisAttachmentInput[] | undefined,
  ): Promise<MantisAttachmentPayload[] | undefined> {
    if (!files || files.length === 0) return undefined;
    return Promise.all(
      files.map(async (f) => {
        const buf = await readFile(f.path);
        return {
          name: f.name ?? basename(f.path),
          content: buf.toString("base64"),
        };
      }),
    );
  }

  private async request<T>(
    method: string,
    path: string,
    opts: { body?: unknown; query?: QueryParams } = {},
  ): Promise<T> {
    const url = this.buildUrl(path, opts.query);
    const headers: Record<string, string> = {
      Authorization: this.token,
      Accept: "application/json",
    };

    let body: string | undefined;
    if (opts.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(opts.body);
    }

    const res = await fetch(url, { method, headers, body });

    const text = await res.text();
    let parsed: unknown = text;
    if (text.length > 0) {
      const ct = res.headers.get("content-type") ?? "";
      if (ct.includes("application/json")) {
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = text;
        }
      }
    } else {
      parsed = null;
    }

    if (!res.ok) {
      throw new MantisApiError(res.status, res.statusText, parsed, url);
    }

    return parsed as T;
  }

  private buildUrl(path: string, query?: QueryParams): string {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(this.baseUrl + cleanPath);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
          for (const v of value) {
            if (v === undefined || v === null) continue;
            url.searchParams.append(`${key}[]`, String(v));
          }
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    }
    return url.toString();
  }
}
