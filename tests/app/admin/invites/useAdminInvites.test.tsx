import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
    expiresAt: "2026-05-02T00:00:00.000Z",
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
    expect(messageApi.success).toHaveBeenCalledWith(ADMIN_INVITES_LABELS.createOk);
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
});
