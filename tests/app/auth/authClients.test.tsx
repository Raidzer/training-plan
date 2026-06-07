import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResetPasswordClient } from "@/app/auth/reset-password/ResetPasswordClient/ResetPasswordClient";
import { VerifyEmailClient } from "@/app/auth/verify-email/VerifyEmailClient/VerifyEmailClient";

const authClientMocks = vi.hoisted(() => ({
  routerPushMock: vi.fn(),
  searchValues: new Map<string, string>(),
  messageSuccessMock: vi.fn(),
  messageErrorMock: vi.fn(),
  formValues: {
    password: "secret1",
    confirm: "secret1",
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: authClientMocks.routerPushMock,
  }),
  useSearchParams: () => ({
    get: (key: string) => authClientMocks.searchValues.get(key) ?? null,
  }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("antd", () => {
  const Form = Object.assign(
    ({
      children,
      onFinish,
    }: {
      children: ReactNode;
      onFinish?: (values: { password: string; confirm: string }) => void;
    }) => (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onFinish?.(authClientMocks.formValues);
        }}
      >
        {children}
      </form>
    ),
    {
      Item: ({ children, label }: { children: ReactNode; label?: string }) => (
        <label>
          {label}
          {children}
        </label>
      ),
    }
  );

  return {
    Form,
    Input: {
      Password: ({ placeholder }: { placeholder?: string }) => (
        <input aria-label={placeholder} placeholder={placeholder} />
      ),
    },
    Button: ({
      children,
      htmlType,
      loading,
    }: {
      children: ReactNode;
      htmlType?: string;
      loading?: boolean;
    }) => (
      <button type={htmlType === "submit" ? "submit" : "button"} disabled={Boolean(loading)}>
        {children}
      </button>
    ),
    Card: ({ children, loading }: { children?: ReactNode; loading?: boolean }) => (
      <div>{loading ? "loading" : children}</div>
    ),
    Typography: {
      Title: ({ children }: { children: ReactNode }) => <h1>{children}</h1>,
      Text: ({ children }: { children: ReactNode }) => <span>{children}</span>,
    },
    message: {
      useMessage: () => [
        {
          success: authClientMocks.messageSuccessMock,
          error: authClientMocks.messageErrorMock,
        },
        <div key="message-holder" />,
      ],
    },
    Spin: () => <div>spin</div>,
  };
});

vi.mock("@ant-design/icons", () => ({
  CloseCircleOutlined: () => <span data-testid="close-icon" />,
  LockOutlined: () => <span data-testid="lock-icon" />,
}));

describe("auth clients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    authClientMocks.searchValues.clear();
    authClientMocks.formValues = {
      password: "secret1",
      confirm: "secret1",
    };
  });

  it("ResetPasswordClient показывает ошибку без token", () => {
    render(<ResetPasswordClient />);

    expect(screen.getByText("Ошибка")).toBeTruthy();
    expect(screen.getByText("Неверная ссылка для сброса пароля. Отсутствует токен.")).toBeTruthy();
  });

  it("ResetPasswordClient отправляет новый пароль и ведет на login при успехе", async () => {
    authClientMocks.searchValues.set("token", "reset-token");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    render(<ResetPasswordClient />);
    fireEvent.click(screen.getByText("Сменить пароль"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "reset-token", password: "secret1" }),
      });
    });
    expect(authClientMocks.messageSuccessMock).toHaveBeenCalledWith("Пароль успешно изменен!");
    expect(authClientMocks.routerPushMock).toHaveBeenCalledWith("/login");
  });

  it("ResetPasswordClient показывает серверную и сетевую ошибку", async () => {
    authClientMocks.searchValues.set("token", "reset-token");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "custom-error" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockRejectedValueOnce(new Error("network"));
    vi.stubGlobal("fetch", fetchMock);

    render(<ResetPasswordClient />);
    fireEvent.click(screen.getByText("Сменить пароль"));

    await waitFor(() => {
      expect(authClientMocks.messageErrorMock).toHaveBeenCalledWith("custom-error");
    });

    fireEvent.click(screen.getByText("Сменить пароль"));

    await waitFor(() => {
      expect(authClientMocks.messageErrorMock).toHaveBeenCalledWith(
        "Произошла ошибка. Пожалуйста, попробуйте позже."
      );
    });
  });

  it("VerifyEmailClient показывает истекшую и невалидную ссылку", () => {
    authClientMocks.searchValues.set("error", "expired");
    const { rerender } = render(<VerifyEmailClient />);

    expect(screen.getByText("Ошибка подтверждения")).toBeTruthy();
    expect(screen.getByText("Ссылка истекла.")).toBeTruthy();

    authClientMocks.searchValues.set("error", "bad-token");
    rerender(<VerifyEmailClient />);

    expect(screen.getByText("Неверная или устаревшая ссылка.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Вернуться ко входу" }).getAttribute("href")).toBe(
      "/login"
    );
  });

  it("VerifyEmailClient показывает загрузку без ошибки", () => {
    render(<VerifyEmailClient />);

    expect(screen.getByText("Проверка ссылки...")).toBeTruthy();
  });
});
