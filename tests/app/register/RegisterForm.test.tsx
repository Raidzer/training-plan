import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ConfigProvider } from "antd";
import { describe, expect, it, vi } from "vitest";

import { RegisterForm } from "@/app/register/RegisterClient/components/RegisterForm/RegisterForm";
import {
  REGISTER_FIELD_IDS,
  REGISTER_TEXT,
} from "@/app/register/RegisterClient/constants/registerConstants";
import type { RegisterSubmitHandler } from "@/app/register/RegisterClient/types/registerTypes";

const TIMEZONE_OPTIONS = [
  {
    value: "Europe/Moscow",
    label: "Москва — Europe/Moscow (UTC+03:00)",
  },
];

function renderRegisterForm({ loading = false, onFinish = vi.fn() } = {}) {
  return {
    onFinish,
    ...render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <RegisterForm
          loading={loading}
          timezoneOptions={TIMEZONE_OPTIONS}
          onFinish={onFinish as RegisterSubmitHandler}
        />
      </ConfigProvider>
    ),
  };
}

describe("RegisterForm", () => {
  it("рендерит доступные поля со стабильными id и autocomplete", () => {
    const { container } = renderRegisterForm();
    const nameInput = screen.getByLabelText(REGISTER_TEXT.nameLabel) as HTMLInputElement;
    const lastNameInput = screen.getByLabelText(REGISTER_TEXT.lastNameLabel) as HTMLInputElement;
    const loginInput = screen.getByLabelText(REGISTER_TEXT.loginLabel) as HTMLInputElement;
    const emailInput = screen.getByLabelText(REGISTER_TEXT.emailLabel) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(REGISTER_TEXT.passwordLabel) as HTMLInputElement;

    expect(screen.getByRole("form", { name: REGISTER_TEXT.formLabel })).toBeTruthy();
    expect(nameInput.id).toBe(REGISTER_FIELD_IDS.name);
    expect(nameInput.autocomplete).toBe("given-name");
    expect(lastNameInput.id).toBe(REGISTER_FIELD_IDS.lastName);
    expect(lastNameInput.autocomplete).toBe("family-name");
    expect(loginInput.id).toBe(REGISTER_FIELD_IDS.login);
    expect(loginInput.autocomplete).toBe("username");
    expect(emailInput.id).toBe(REGISTER_FIELD_IDS.email);
    expect(emailInput.type).toBe("email");
    expect(emailInput.autocomplete).toBe("email");
    expect(passwordInput.id).toBe(REGISTER_FIELD_IDS.password);
    expect(passwordInput.autocomplete).toBe("new-password");
    const passwordDescriptionId = passwordInput.getAttribute("aria-describedby");
    expect(passwordDescriptionId).toBeTruthy();
    expect(document.getElementById(String(passwordDescriptionId))?.textContent).toContain(
      REGISTER_TEXT.passwordHint
    );
    expect(screen.getByRole("radiogroup", { name: REGISTER_TEXT.genderLabel }).id).toBe(
      REGISTER_FIELD_IDS.gender
    );
    expect(screen.getByRole("combobox", { name: REGISTER_TEXT.timezoneLabel }).id).toBe(
      REGISTER_FIELD_IDS.timezone
    );
    expect(screen.queryByText(/Подтвердите пароль/i)).toBeNull();
    expect(container.querySelector("main")).toBeNull();
  });

  it("явно отмечает необязательную фамилию и начальные значения", () => {
    renderRegisterForm();

    expect(screen.getByText(REGISTER_TEXT.requiredHint)).toBeTruthy();
    expect(screen.getByLabelText(REGISTER_TEXT.lastNameLabel)).toBeTruthy();
    expect((screen.getByRole("radio", { name: "Мужской" }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByText(/Москва — Europe\/Moscow/)).toBeTruthy();
  });

  it("валидирует ограничения API до отправки", async () => {
    const { onFinish } = renderRegisterForm();

    const nameInput = screen.getByLabelText(REGISTER_TEXT.nameLabel);
    const loginInput = screen.getByLabelText(REGISTER_TEXT.loginLabel);
    const emailInput = screen.getByLabelText(REGISTER_TEXT.emailLabel);
    const passwordInput = screen.getByLabelText(REGISTER_TEXT.passwordLabel);

    fireEvent.change(nameInput, {
      target: { value: "Я" },
    });
    fireEvent.blur(nameInput);
    fireEvent.change(loginInput, {
      target: { value: "ab" },
    });
    fireEvent.blur(loginInput);
    fireEvent.change(emailInput, {
      target: { value: "wrong-email" },
    });
    fireEvent.blur(emailInput);
    fireEvent.change(passwordInput, {
      target: { value: "12345" },
    });
    fireEvent.blur(passwordInput);
    fireEvent.click(screen.getByRole("button", { name: REGISTER_TEXT.submit }));

    expect(await screen.findByText(REGISTER_TEXT.nameMin)).toBeTruthy();
    expect(await screen.findByText(REGISTER_TEXT.loginMin)).toBeTruthy();
    expect(await screen.findByText(REGISTER_TEXT.emailInvalid)).toBeTruthy();
    expect(await screen.findByText(REGISTER_TEXT.passwordMin)).toBeTruthy();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("отправляет корректные данные без подтверждения пароля", async () => {
    const { onFinish } = renderRegisterForm();

    fireEvent.change(screen.getByLabelText(REGISTER_TEXT.nameLabel), {
      target: { value: "Иван" },
    });
    fireEvent.change(screen.getByLabelText(REGISTER_TEXT.loginLabel), {
      target: { value: "runner" },
    });
    fireEvent.change(screen.getByLabelText(REGISTER_TEXT.emailLabel), {
      target: { value: "runner@example.com" },
    });
    fireEvent.change(screen.getByLabelText(REGISTER_TEXT.passwordLabel), {
      target: { value: "secret123" },
    });
    fireEvent.click(screen.getByRole("button", { name: REGISTER_TEXT.submit }));

    await waitFor(() => {
      expect(onFinish).toHaveBeenCalledWith({
        name: "Иван",
        gender: "male",
        login: "runner",
        email: "runner@example.com",
        timezone: "Europe/Moscow",
        password: "secret123",
      });
    });
  });

  it("блокирует форму и CTA во время отправки", () => {
    renderRegisterForm({ loading: true });

    expect((screen.getByLabelText(REGISTER_TEXT.nameLabel) as HTMLInputElement).disabled).toBe(
      true
    );
    expect((screen.getByLabelText(REGISTER_TEXT.passwordLabel) as HTMLInputElement).disabled).toBe(
      true
    );
    expect(
      (screen.getByRole("button", { name: new RegExp(REGISTER_TEXT.submit) }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
    expect(
      screen.getByRole("form", { name: REGISTER_TEXT.formLabel }).getAttribute("aria-busy")
    ).toBe("true");
  });
});
