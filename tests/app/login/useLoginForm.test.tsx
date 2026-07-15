import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LOGIN_TEXT } from "@/app/login/LoginClient/constants/loginConstants";
import { useLoginForm } from "@/app/login/LoginClient/hooks/useLoginForm";
import type { LoginFields } from "@/app/login/LoginClient/types/loginTypes";

const loginHookMocks = vi.hoisted(() => ({
  messageError: vi.fn(),
  messageSuccess: vi.fn(),
  routerPush: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock("antd", () => ({
  App: {
    useApp: () => ({
      message: {
        error: loginHookMocks.messageError,
        success: loginHookMocks.messageSuccess,
      },
    }),
  },
}));

vi.mock("next-auth/react", () => ({
  signIn: loginHookMocks.signIn,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: loginHookMocks.routerPush,
  }),
}));

const LOGIN_FIELDS: LoginFields = {
  email: "runner",
  password: "secret123",
};

const SUCCESS_RESPONSE = {
  error: null,
  ok: true,
  status: 200,
  url: "/dashboard?from=login",
};

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

describe("useLoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loginHookMocks.signIn.mockResolvedValue(SUCCESS_RESPONSE);
  });

  it("отправляет точный credentials payload и переходит по URL ответа", async () => {
    const { result } = renderHook(() => useLoginForm());

    await act(async () => {
      await result.current.onFinish(LOGIN_FIELDS);
    });

    expect(loginHookMocks.signIn).toHaveBeenCalledWith("credentials", {
      email: "runner",
      password: "secret123",
      redirect: false,
      callbackUrl: "/dashboard",
    });
    expect(loginHookMocks.messageSuccess).toHaveBeenCalledWith(LOGIN_TEXT.success);
    expect(loginHookMocks.routerPush).toHaveBeenCalledWith("/dashboard?from=login");
    expect(result.current.isSubmitting).toBe(false);
  });

  it("обрезает пробелы у идентификатора перед отправкой", async () => {
    const { result } = renderHook(() => useLoginForm());

    await act(async () => {
      await result.current.onFinish({
        email: "  runner  ",
        password: "secret123",
      });
    });

    expect(loginHookMocks.signIn).toHaveBeenCalledWith("credentials", {
      email: "runner",
      password: "secret123",
      redirect: false,
      callbackUrl: "/dashboard",
    });
  });

  it("использует dashboard как резервный маршрут", async () => {
    loginHookMocks.signIn.mockResolvedValueOnce({
      ...SUCCESS_RESPONSE,
      url: null,
    });
    const { result } = renderHook(() => useLoginForm());

    await act(async () => {
      await result.current.onFinish(LOGIN_FIELDS);
    });

    expect(loginHookMocks.routerPush).toHaveBeenCalledWith("/dashboard");
  });

  it("оставляет абсолютный callback NextAuth внутри текущего origin", async () => {
    loginHookMocks.signIn.mockResolvedValueOnce({
      ...SUCCESS_RESPONSE,
      url: "http://localhost:3000/dashboard?from=login",
    });
    const { result } = renderHook(() => useLoginForm());

    await act(async () => {
      await result.current.onFinish(LOGIN_FIELDS);
    });

    expect(loginHookMocks.routerPush).toHaveBeenCalledWith("/dashboard?from=login");
  });

  it("показывает ошибку учетных данных и не выполняет переход", async () => {
    loginHookMocks.signIn.mockResolvedValueOnce({
      ...SUCCESS_RESPONSE,
      error: "CredentialsSignin",
      ok: false,
      url: null,
    });
    const { result } = renderHook(() => useLoginForm());

    await act(async () => {
      await result.current.onFinish(LOGIN_FIELDS);
    });

    expect(loginHookMocks.messageError).toHaveBeenCalledWith(LOGIN_TEXT.invalidCredentials);
    expect(loginHookMocks.messageSuccess).not.toHaveBeenCalled();
    expect(loginHookMocks.routerPush).not.toHaveBeenCalled();
  });

  it("не принимает неуспешный ответ без текстовой ошибки за успешный вход", async () => {
    loginHookMocks.signIn.mockResolvedValueOnce({
      ...SUCCESS_RESPONSE,
      error: null,
      ok: false,
      url: null,
    });
    const { result } = renderHook(() => useLoginForm());

    await act(async () => {
      await result.current.onFinish(LOGIN_FIELDS);
    });

    expect(loginHookMocks.messageError).toHaveBeenCalledWith(LOGIN_TEXT.invalidCredentials);
    expect(loginHookMocks.routerPush).not.toHaveBeenCalled();
  });

  it("обрабатывает пустой ответ и сетевое исключение", async () => {
    loginHookMocks.signIn
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("network"));
    const { result } = renderHook(() => useLoginForm());

    await act(async () => {
      await result.current.onFinish(LOGIN_FIELDS);
    });
    await act(async () => {
      await result.current.onFinish(LOGIN_FIELDS);
    });

    expect(loginHookMocks.messageError).toHaveBeenCalledTimes(2);
    expect(loginHookMocks.messageError).toHaveBeenNthCalledWith(1, LOGIN_TEXT.requestError);
    expect(loginHookMocks.messageError).toHaveBeenNthCalledWith(2, LOGIN_TEXT.requestError);
    expect(loginHookMocks.routerPush).not.toHaveBeenCalled();
    expect(result.current.isSubmitting).toBe(false);
  });

  it("блокирует повторную отправку до завершения первого запроса", async () => {
    const deferredResponse = createDeferred<typeof SUCCESS_RESPONSE>();
    loginHookMocks.signIn.mockReturnValueOnce(deferredResponse.promise);
    const { result } = renderHook(() => useLoginForm());
    let firstSubmission!: Promise<void>;

    act(() => {
      firstSubmission = result.current.onFinish(LOGIN_FIELDS);
    });

    await waitFor(() => {
      expect(result.current.isSubmitting).toBe(true);
    });

    await act(async () => {
      await result.current.onFinish(LOGIN_FIELDS);
    });

    expect(loginHookMocks.signIn).toHaveBeenCalledTimes(1);

    await act(async () => {
      deferredResponse.resolve(SUCCESS_RESPONSE);
      await firstSubmission;
    });

    expect(result.current.isSubmitting).toBe(false);
    expect(loginHookMocks.routerPush).toHaveBeenCalledTimes(1);
  });
});
