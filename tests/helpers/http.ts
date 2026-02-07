type CreateJsonResponseOptions = {
  status?: number;
  headers?: HeadersInit;
};

type CreateJsonRequestOptions = {
  url: string;
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
};

type CreateRequestWithQueryOptions = {
  path: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  method?: string;
};

export function createJsonResponse<T>(body: T, options: CreateJsonResponseOptions = {}): Response {
  const headers = new Headers(options.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const payload = JSON.stringify(body);
  return new Response(payload, {
    status: options.status ?? 200,
    headers,
  });
}

export async function readJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T;
  return payload;
}

export async function readTextResponse(response: Response): Promise<string> {
  const payload = await response.text();
  return payload;
}

export function createJsonRequest(options: CreateJsonRequestOptions): Request {
  const headers = new Headers(options.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const serializedBody = options.body === undefined ? undefined : JSON.stringify(options.body);

  return new Request(options.url, {
    method: options.method ?? "POST",
    headers,
    body: serializedBody,
  });
}

export function createRequestWithQuery(options: CreateRequestWithQueryOptions): Request {
  const url = new URL(options.path, "http://localhost");

  if (options.query) {
    const queryEntries = Object.entries(options.query);
    for (const [key, value] of queryEntries) {
      if (value === undefined || value === null) {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }

  return new Request(url.toString(), {
    method: options.method ?? "GET",
  });
}
