import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { REGISTER_TEXT } from "@/app/register/RegisterClient/constants/registerConstants";
import { useRegisterForm } from "@/app/register/RegisterClient/hooks/useRegisterForm";
import type { RegisterFields } from "@/app/register/RegisterClient/types/registerTypes";
import type { MessageInstance } from "antd/es/message/interface";

const routerMock = vi.hoisted(() => ({
  push: vi.fn(),
}));

const searchParamsMock = vi.hoisted(() => ({
  get: vi.fn(),
}));

const signInMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  useSearchParams: () => searchParamsMock,
}));

vi.mock("next-auth/react", () => ({
  signIn: signInMock,
}));

function createMessageApi() {
  return {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
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

function createRegisterFields(overrides: Partial<RegisterFields> = {}): RegisterFields {
  return {
    name: "Иван",
    lastName: "Петров",
    gender: "male",
    login: "runner",
    email: "runner@example.com",
    password: "secret123",
    confirmPassword: "secret123",
    timezone: "Europe/Moscow",
    ...overrides,
  };
}

describe("useRegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsMock.get.mockReturnValue("invite-token-123");
    signInMock.mockResolvedValue({
      url: "/dashboard",
    });
    global.fetch = vi.fn() as unknown as typeof fetch;
  });

  it("blocks submit when invite token is missing", async () => {
    searchParamsMock.get.mockReturnValue("");
    const messageApi = createMessageApi();
    const { result } = renderHook(() => useRegisterForm(messageApi));

    expect(result.current.hasInvite).toBe(false);

    await act(async () => {
      await result.current.onFinish?.(createRegisterFields());
    });

    expect(messageApi.error).toHaveBeenCalledWith(REGISTER_TEXT.inviteRequired);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("registers user, signs in and redirects to returned URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({}));
    global.fetch = fetchMock as unknown as typeof fetch;
    const messageApi = createMessageApi();
    const { result } = renderHook(() => useRegisterForm(messageApi));

    await act(async () => {
      await result.current.onFinish?.(createRegisterFields());
    });

    const registerRequest = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const registerBody = JSON.parse(String(registerRequest.body)) as {
      inviteToken: string;
      confirmPassword?: string;
    };

    expect(registerRequest.method).toBe("POST");
    expect(registerBody.inviteToken).toBe("invite-token-123");
    expect(registerBody.confirmPassword).toBeUndefined();
    expect(messageApi.success).toHaveBeenCalledWith(REGISTER_TEXT.registerSuccess);
    expect(signInMock).toHaveBeenCalledWith("credentials", {
      redirect: false,
      email: "runner@example.com",
      password: "secret123",
      callbackUrl: "/dashboard",
    });
    expect(routerMock.push).toHaveBeenCalledWith("/dashboard");
  });

  it("maps invite API errors to user-facing messages", async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ error: "invite_used" }, 409));
    global.fetch = fetchMock as unknown as typeof fetch;
    const messageApi = createMessageApi();
    const { result } = renderHook(() => useRegisterForm(messageApi));

    await act(async () => {
      await result.current.onFinish?.(createRegisterFields());
    });

    expect(messageApi.error).toHaveBeenCalledWith(REGISTER_TEXT.inviteUsed);
    expect(signInMock).not.toHaveBeenCalled();
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it("redirects to login when automatic sign in fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({}));
    global.fetch = fetchMock as unknown as typeof fetch;
    signInMock.mockResolvedValueOnce({
      error: "CredentialsSignin",
    });
    const messageApi = createMessageApi();
    const { result } = renderHook(() => useRegisterForm(messageApi));

    await act(async () => {
      await result.current.onFinish?.(createRegisterFields());
    });

    expect(messageApi.warning).toHaveBeenCalledWith(REGISTER_TEXT.autoLoginFailed);
    expect(routerMock.push).toHaveBeenCalledWith("/login");
  });
});
