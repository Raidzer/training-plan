import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/app/login/LoginClient/components/LoginForm/LoginForm";
import { LOGIN_FORM_IDS, LOGIN_TEXT } from "@/app/login/LoginClient/constants/loginConstants";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: ReactNode;
    href: string;
    className?: string;
  }) => (
    <a className={className} href={href}>
      {children}
    </a>
  ),
}));

function renderLoginForm(isSubmitting = false, onFinish = vi.fn()) {
  render(
    <>
      <h1 id={LOGIN_FORM_IDS.title}>{LOGIN_TEXT.title}</h1>
      <LoginForm isSubmitting={isSubmitting} onFinish={onFinish} />
    </>
  );

  return { onFinish };
}

describe("LoginForm", () => {
  it("связывает labels, стабильные id и атрибуты autofill", () => {
    renderLoginForm();

    const identifierInput = screen.getByLabelText<HTMLInputElement>(LOGIN_TEXT.emailLabel);
    const passwordInput = screen.getByLabelText<HTMLInputElement>(LOGIN_TEXT.passwordLabel);
    const form = screen.getByRole("form", { name: LOGIN_TEXT.title });

    expect(form.id).toBe(LOGIN_FORM_IDS.form);
    expect(identifierInput.id).toBe(LOGIN_FORM_IDS.identifier);
    expect(identifierInput.name).toBe("email");
    expect(identifierInput.type).toBe("text");
    expect(identifierInput.autocomplete).toBe("username");
    expect(passwordInput.id).toBe(LOGIN_FORM_IDS.password);
    expect(passwordInput.name).toBe("password");
    expect(passwordInput.type).toBe("password");
    expect(passwordInput.autocomplete).toBe("current-password");
  });

  it("показывает ограничения identifier и password до отправки", async () => {
    const { onFinish } = renderLoginForm();

    fireEvent.change(screen.getByLabelText(LOGIN_TEXT.emailLabel), {
      target: { value: "a" },
    });
    fireEvent.change(screen.getByLabelText(LOGIN_TEXT.passwordLabel), {
      target: { value: "12345" },
    });
    fireEvent.click(screen.getByRole("button", { name: LOGIN_TEXT.submit }));

    expect(await screen.findByText(LOGIN_TEXT.emailMin)).toBeTruthy();
    expect(await screen.findByText(LOGIN_TEXT.passwordMin)).toBeTruthy();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("проверяет максимальную длину identifier", async () => {
    const { onFinish } = renderLoginForm();

    fireEvent.change(screen.getByLabelText(LOGIN_TEXT.emailLabel), {
      target: { value: "a".repeat(256) },
    });
    fireEvent.change(screen.getByLabelText(LOGIN_TEXT.passwordLabel), {
      target: { value: "secret123" },
    });
    fireEvent.click(screen.getByRole("button", { name: LOGIN_TEXT.submit }));

    expect(await screen.findByText(LOGIN_TEXT.emailMax)).toBeTruthy();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("отправляет валидные wire keys", async () => {
    const { onFinish } = renderLoginForm();

    fireEvent.change(screen.getByLabelText(LOGIN_TEXT.emailLabel), {
      target: { value: "runner" },
    });
    fireEvent.change(screen.getByLabelText(LOGIN_TEXT.passwordLabel), {
      target: { value: "secret123" },
    });
    fireEvent.click(screen.getByRole("button", { name: LOGIN_TEXT.submit }));

    await waitFor(() => {
      expect(onFinish).toHaveBeenCalledWith({
        email: "runner",
        password: "secret123",
      });
    });
  });

  it("блокирует поля и submit во время отправки", () => {
    renderLoginForm(true);

    expect(screen.getByRole("form", { name: LOGIN_TEXT.title }).getAttribute("aria-busy")).toBe(
      "true"
    );
    expect(screen.getByLabelText<HTMLInputElement>(LOGIN_TEXT.emailLabel).disabled).toBe(true);
    expect(screen.getByLabelText<HTMLInputElement>(LOGIN_TEXT.passwordLabel).disabled).toBe(true);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: /Войти/ }).disabled).toBe(true);
  });

  it("сохраняет маршрут восстановления пароля", () => {
    renderLoginForm();

    expect(screen.getByRole("link", { name: LOGIN_TEXT.forgotPassword }).getAttribute("href")).toBe(
      "/auth/forgot-password"
    );
  });
});
