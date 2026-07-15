import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const adminInvitesFormMocks = vi.hoisted(() => {
  const formMock = {
    resetFields: vi.fn(),
  };

  return {
    formMock,
    useFormMock: vi.fn(() => [formMock]),
  };
});

vi.mock("antd", async () => {
  const actual = await vi.importActual<typeof import("antd")>("antd");

  return {
    ...actual,
    Form: {
      ...actual.Form,
      useForm: adminInvitesFormMocks.useFormMock,
    },
  };
});

import { ADMIN_INVITES_LABELS } from "@/app/(protected)/admin/invites/AdminInvitesClient/constants/adminInvitesConstants";
import { useAdminInvites } from "@/app/(protected)/admin/invites/AdminInvitesClient/hooks/useAdminInvites";
import type {
  AdminInviteRow,
  InviteFormValues,
} from "@/app/(protected)/admin/invites/AdminInvitesClient/types/adminInvitesTypes";
import type { MessageInstance } from "antd/es/message/interface";

function createMessageApi() {
  return {
    error: vi.fn(),
    success: vi.fn(),
  } as unknown as MessageInstance;
}

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

function createInvite(overrides: Partial<AdminInviteRow> = {}): AdminInviteRow {
  return {
    id: 1,
    role: "athlete",
    createdAt: "2026-05-01T00:00:00.000Z",
    expiresAt: "2099-05-02T00:00:00.000Z",
    usedAt: null,
    status: "active",
    createdBy: null,
    usedBy: null,
    ...overrides,
  };
}

describe("useAdminInvites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn() as unknown as typeof fetch;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates invite, stores token and exposes last invite URL", async () => {
    const initialInvite = createInvite({
      id: 1,
    });
    const createdInvite = createInvite({
      id: 2,
      role: "coach",
    });
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        invite: createdInvite,
        token: "invite-token",
      })
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    const messageApi = createMessageApi();
    const { result } = renderHook(() =>
      useAdminInvites({
        invites: [initialInvite],
        messageApi,
      })
    );

    await act(async () => {
      await result.current.handleCreate({ role: "coach" });
    });

    const createRequest = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(createRequest.body)) as InviteFormValues;

    expect(createRequest.method).toBe("POST");
    expect(body).toEqual({ role: "coach" });
    expect(result.current.rows.map((row) => row.id)).toEqual([2, 1]);
    expect(result.current.tokenById[2]).toBe("invite-token");
    expect(result.current.lastInviteUrl).toContain("/register?invite=invite-token");
    expect(adminInvitesFormMocks.formMock.resetFields).toHaveBeenCalledTimes(1);
    expect(messageApi.success).toHaveBeenCalledWith(ADMIN_INVITES_LABELS.createOk);
  });

  it("expires an active invite and hides its runtime URL without a reload", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T00:00:00.000Z"));
    const createdInvite = createInvite({
      id: 2,
      expiresAt: "2026-05-01T00:00:01.000Z",
    });
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        invite: createdInvite,
        token: "short-lived-token",
      })
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    const messageApi = createMessageApi();
    const { result } = renderHook(() =>
      useAdminInvites({
        invites: [],
        messageApi,
      })
    );

    await act(async () => {
      await result.current.handleCreate({ role: "athlete" });
    });

    expect(result.current.rows[0]?.status).toBe("active");
    expect(result.current.lastInviteUrl).toContain("short-lived-token");

    act(() => {
      vi.advanceTimersByTime(1_050);
    });

    expect(result.current.rows[0]?.status).toBe("expired");
    expect(result.current.lastInviteUrl).toBe("");
  });

  it("maps create API error to user-facing message", async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ error: "forbidden" }, 403));
    global.fetch = fetchMock as unknown as typeof fetch;
    const messageApi = createMessageApi();
    const { result } = renderHook(() =>
      useAdminInvites({
        invites: [],
        messageApi,
      })
    );

    await act(async () => {
      await result.current.handleCreate({ role: "athlete" });
    });

    expect(result.current.rows).toEqual([]);
    expect(messageApi.error).toHaveBeenCalledWith(ADMIN_INVITES_LABELS.forbidden);
  });

  it("rejects malformed success response without mutating rows", async () => {
    const initialInvite = createInvite();
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        invite: createInvite({ id: 2 }),
      })
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    const messageApi = createMessageApi();
    const { result } = renderHook(() =>
      useAdminInvites({
        invites: [initialInvite],
        messageApi,
      })
    );

    await act(async () => {
      await result.current.handleCreate({ role: "athlete" });
    });

    expect(result.current.rows).toEqual([initialInvite]);
    expect(result.current.tokenById).toEqual({});
    expect(result.current.lastInviteUrl).toBe("");
    expect(adminInvitesFormMocks.formMock.resetFields).not.toHaveBeenCalled();
    expect(messageApi.error).toHaveBeenCalledWith(ADMIN_INVITES_LABELS.createFail);
  });

  it("prevents duplicate create requests while the first request is pending", async () => {
    let resolveResponse: ((response: Response) => void) | undefined;
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveResponse = resolve;
        })
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    const messageApi = createMessageApi();
    const { result } = renderHook(() =>
      useAdminInvites({
        invites: [],
        messageApi,
      })
    );

    let firstRequest: Promise<void> | undefined;
    let duplicateRequest: Promise<void> | undefined;
    act(() => {
      firstRequest = result.current.handleCreate({ role: "coach" });
      duplicateRequest = result.current.handleCreate({ role: "coach" });
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.creating).toBe(true);

    await act(async () => {
      resolveResponse?.(
        createJsonResponse({
          invite: createInvite({ id: 2, role: "coach" }),
          token: "single-token",
        })
      );
      await Promise.all([firstRequest, duplicateRequest]);
    });

    await waitFor(() => {
      expect(result.current.creating).toBe(false);
    });
    expect(result.current.rows.map((row) => row.id)).toEqual([2]);
    expect(messageApi.success).toHaveBeenCalledTimes(1);
  });

  it("shows fallback error after a network failure and releases creating state", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network unavailable"));
    global.fetch = fetchMock as unknown as typeof fetch;
    const messageApi = createMessageApi();
    const { result } = renderHook(() =>
      useAdminInvites({
        invites: [],
        messageApi,
      })
    );

    await act(async () => {
      await result.current.handleCreate({ role: "athlete" });
    });

    expect(result.current.creating).toBe(false);
    expect(result.current.rows).toEqual([]);
    expect(messageApi.error).toHaveBeenCalledWith(ADMIN_INVITES_LABELS.createFail);
  });

  it("copies invite URL and handles unavailable clipboard states", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: writeTextMock,
      },
    });
    const messageApi = createMessageApi();
    const { result } = renderHook(() =>
      useAdminInvites({
        invites: [],
        messageApi,
      })
    );

    await act(async () => {
      await result.current.handleCopy("");
    });

    expect(messageApi.error).toHaveBeenCalledWith(ADMIN_INVITES_LABELS.linkUnavailable);

    await act(async () => {
      await result.current.handleCopy("https://example.com/register?invite=token");
    });

    expect(writeTextMock).toHaveBeenCalledWith("https://example.com/register?invite=token");
    expect(messageApi.success).toHaveBeenCalledWith(ADMIN_INVITES_LABELS.copiedOk);

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });

    await act(async () => {
      await result.current.handleCopy("https://example.com/register?invite=token");
    });

    expect(messageApi.error).toHaveBeenCalledWith(ADMIN_INVITES_LABELS.copyFail);
  });

  it("shows copy failure when Clipboard API rejects the request", async () => {
    const writeTextMock = vi.fn().mockRejectedValue(new Error("clipboard denied"));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: writeTextMock,
      },
    });
    const messageApi = createMessageApi();
    const { result } = renderHook(() =>
      useAdminInvites({
        invites: [],
        messageApi,
      })
    );

    await act(async () => {
      await result.current.handleCopy("https://example.com/register?invite=token");
    });

    expect(messageApi.success).not.toHaveBeenCalled();
    expect(messageApi.error).toHaveBeenCalledWith(ADMIN_INVITES_LABELS.copyFail);
  });
});
