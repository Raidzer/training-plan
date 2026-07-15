import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginClient } from "@/app/login/LoginClient/LoginClient";
import { LOGIN_TEXT } from "@/app/login/LoginClient/constants/loginConstants";

const loginClientMocks = vi.hoisted(() => ({
  isSubmitting: false,
  onFinish: vi.fn(),
}));

vi.mock("@/app/login/LoginClient/hooks/useLoginForm", () => ({
  useLoginForm: () => ({
    isSubmitting: loginClientMocks.isSubmitting,
    onFinish: loginClientMocks.onFinish,
  }),
}));

describe("LoginClient", () => {
  beforeEach(() => {
    loginClientMocks.isSubmitting = false;
    vi.clearAllMocks();
  });

  it("компонует единственный h1 и форму без вложенного main", () => {
    render(<LoginClient />);

    expect(screen.getByText("Беговой клуб СПИРОС")).toBeTruthy();
    expect(LOGIN_TEXT.title).toBe("Вход в личный кабинет");
    expect(screen.getByRole("heading", { level: 1, name: LOGIN_TEXT.title })).toBeTruthy();
    expect(screen.getByRole("form", { name: LOGIN_TEXT.title })).toBeTruthy();
    expect(screen.queryByRole("main")).toBeNull();
  });

  it("передаёт валидные значения из формы в hook", async () => {
    render(<LoginClient />);

    fireEvent.change(screen.getByLabelText(LOGIN_TEXT.emailLabel), {
      target: { value: "runner" },
    });
    fireEvent.change(screen.getByLabelText(LOGIN_TEXT.passwordLabel), {
      target: { value: "secret123" },
    });
    fireEvent.click(screen.getByRole("button", { name: LOGIN_TEXT.submit }));

    await waitFor(() => {
      expect(loginClientMocks.onFinish).toHaveBeenCalledWith({
        email: "runner",
        password: "secret123",
      });
    });
  });

  it("отражает loading-состояние hook в форме", () => {
    loginClientMocks.isSubmitting = true;
    render(<LoginClient />);

    expect(screen.getByRole<HTMLButtonElement>("button", { name: /Войти/ }).disabled).toBe(true);
  });
});
