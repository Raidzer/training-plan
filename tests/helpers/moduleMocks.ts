import { vi } from "vitest";

export type SessionLike = {
  user?: Record<string, unknown> | null;
} | null;

export function createAuthModuleMocks() {
  const authMock = vi.fn<() => Promise<SessionLike>>();
  const getServerSessionMock = vi.fn<() => Promise<SessionLike>>();

  const setAuthSession = (session: SessionLike) => {
    authMock.mockResolvedValue(session);
  };

  const setServerSession = (session: SessionLike) => {
    getServerSessionMock.mockResolvedValue(session);
  };

  return {
    authMock,
    getServerSessionMock,
    setAuthSession,
    setServerSession,
  };
}

export function createNextResponseMock() {
  const jsonMock = vi.fn((body: unknown, init?: ResponseInit) => {
    const headers = new Headers(init?.headers);
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    return new Response(JSON.stringify(body), {
      ...init,
      headers,
    });
  });

  const redirectMock = vi.fn((url: string | URL, init?: number | ResponseInit) => {
    const responseInit: ResponseInit = typeof init === "number" ? { status: init } : (init ?? {});

    const headers = new Headers(responseInit.headers);
    headers.set("location", String(url));

    return new Response(null, {
      ...responseInit,
      status: responseInit.status ?? 307,
      headers,
    });
  });

  return {
    NextResponse: {
      json: jsonMock,
      redirect: redirectMock,
    },
    jsonMock,
    redirectMock,
  };
}

export function createDbMethodMocks() {
  return {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  };
}
