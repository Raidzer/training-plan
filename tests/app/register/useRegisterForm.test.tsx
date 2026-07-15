import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { REGISTER_TEXT } from "@/app/register/RegisterClient/constants/registerConstants";
import { useRegisterForm } from "@/app/register/RegisterClient/hooks/useRegisterForm";
import type {
  RegisterFields,
  RegisterMessageApi,
} from "@/app/register/RegisterClient/types/registerTypes";

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

function createMessageApi(): RegisterMessageApi {
  return {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  } as unknown as RegisterMessageApi;
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
    timezone: "Europe/Moscow",
    ...overrides,
  };
}

describe("useRegisterForm", () => {
  beforeEach(() => {
    searchParamsMock.get.mockReturnValue("invite-token-123");
    signInMock.mockResolvedValue({
      url: "/dashboard",
    });
    vi.stubGlobal("fetch", vi.fn() as unknown as typeof fetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("блокирует отправку без подходящего invite token", async () => {
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

  it("сохраняет границу длины invite token и обрезает пробелы", () => {
    searchParamsMock.get.mockReturnValue(" 123456789 ");
    const messageApi = createMessageApi();
    const { result, rerender } = renderHook(() => useRegisterForm(messageApi));

    expect(result.current.hasInvite).toBe(false);

    searchParamsMock.get.mockReturnValue(" 1234567890 ");
    rerender();

    expect(result.current.hasInvite).toBe(true);
  });

  it("нормализует payload, входит и переходит по URL ответа", async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);
    const messageApi = createMessageApi();
    const { result } = renderHook(() => useRegisterForm(messageApi));

    await act(async () => {
      await result.current.onFinish?.(
        createRegisterFields({
          name: "  Иван  ",
          lastName: "  Петров  ",
          login: "  runner  ",
          email: "  runner@example.com  ",
          password: " secret123 ",
          timezone: " Europe/Moscow ",
        })
      );
    });

    const registerRequest = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const registerBody = JSON.parse(String(registerRequest.body)) as Record<string, unknown>;

    expect(registerRequest.method).toBe("POST");
    expect(registerBody).toEqual({
      name: "Иван",
      lastName: "Петров",
      gender: "male",
      login: "runner",
      email: "runner@example.com",
      password: " secret123 ",
      timezone: "Europe/Moscow",
      inviteToken: "invite-token-123",
    });
    expect(registerBody.confirmPassword).toBeUndefined();
    expect(messageApi.success).toHaveBeenCalledWith(REGISTER_TEXT.registerSuccess);
    expect(signInMock).toHaveBeenCalledWith("credentials", {
      redirect: false,
      email: "runner@example.com",
      password: " secret123 ",
      callbackUrl: "/dashboard",
    });
    expect(routerMock.push).toHaveBeenCalledWith("/dashboard");
  });

  it.each([
    ["invite_invalid", REGISTER_TEXT.inviteInvalid],
    ["invite_used", REGISTER_TEXT.inviteUsed],
    ["invite_expired", REGISTER_TEXT.inviteExpired],
    ["user_exists", REGISTER_TEXT.userExists],
    ["Email or login already in use", REGISTER_TEXT.userExists],
    ["unexpected backend detail", REGISTER_TEXT.registerFailed],
  ])("безопасно отображает ошибку API %s", async (apiError, expectedMessage) => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ error: apiError }, 409));
    vi.stubGlobal("fetch", fetchMock);
    const messageApi = createMessageApi();
    const { result } = renderHook(() => useRegisterForm(messageApi));

    await act(async () => {
      await result.current.onFinish?.(createRegisterFields());
    });

    expect(messageApi.error).toHaveBeenCalledWith(expectedMessage);
    expect(signInMock).not.toHaveBeenCalled();
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it("использует безопасный fallback для ответа без JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("not-json", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    const messageApi = createMessageApi();
    const { result } = renderHook(() => useRegisterForm(messageApi));

    await act(async () => {
      await result.current.onFinish?.(createRegisterFields());
    });

    expect(messageApi.error).toHaveBeenCalledWith(REGISTER_TEXT.registerFailed);
  });

  it("не запускает повторный запрос, пока регистрация выполняется", async () => {
    let resolveResponse: ((response: Response) => void) | undefined;
    const pendingResponse = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });
    const fetchMock = vi.fn().mockReturnValue(pendingResponse);
    vi.stubGlobal("fetch", fetchMock);
    const messageApi = createMessageApi();
    const { result } = renderHook(() => useRegisterForm(messageApi));
    const submit = result.current.onFinish as (values: RegisterFields) => Promise<void>;
    let firstSubmission: Promise<void> | undefined;

    act(() => {
      firstSubmission = submit(createRegisterFields());
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    await act(async () => {
      await submit(createRegisterFields({ email: "second@example.com" }));
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveResponse?.(createJsonResponse({}));
      await firstSubmission;
    });

    expect(result.current.loading).toBe(false);
    expect(signInMock).toHaveBeenCalledTimes(1);
  });

  it("переходит ко входу, если автоматическая авторизация не удалась", async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);
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

  it("переходит ко входу при пустом ответе автоматической авторизации", async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);
    signInMock.mockResolvedValueOnce(undefined);
    const messageApi = createMessageApi();
    const { result } = renderHook(() => useRegisterForm(messageApi));

    await act(async () => {
      await result.current.onFinish?.(createRegisterFields());
    });

    expect(messageApi.warning).toHaveBeenCalledWith(REGISTER_TEXT.autoLoginFailed);
    expect(routerMock.push).toHaveBeenCalledWith("/login");
  });

  it("сбрасывает loading и сообщает о сетевой ошибке", async () => {
    const requestError = new Error("network down");
    const fetchMock = vi.fn().mockRejectedValue(requestError);
    const consoleErrorMock = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", fetchMock);
    const messageApi = createMessageApi();
    const { result } = renderHook(() => useRegisterForm(messageApi));

    await act(async () => {
      await result.current.onFinish?.(createRegisterFields());
    });

    expect(messageApi.error).toHaveBeenCalledWith(REGISTER_TEXT.requestError);
    expect(result.current.loading).toBe(false);
    expect(consoleErrorMock).toHaveBeenCalledWith(requestError);
    consoleErrorMock.mockRestore();
  });
});
