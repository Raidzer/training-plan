import { render, screen } from "@testing-library/react";
import { App, ConfigProvider } from "antd";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useRegisterFormMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/register/RegisterClient/hooks/useRegisterForm", () => ({
  useRegisterForm: useRegisterFormMock,
}));

import { RegisterClient } from "@/app/register/RegisterClient/RegisterClient";
import { REGISTER_TEXT } from "@/app/register/RegisterClient/constants/registerConstants";

function renderRegisterClient() {
  return render(
    <ConfigProvider theme={{ token: { motion: false } }}>
      <App>
        <RegisterClient />
      </App>
    </ConfigProvider>
  );
}

describe("RegisterClient", () => {
  beforeEach(() => {
    useRegisterFormMock.mockReturnValue({
      loading: false,
      hasInvite: true,
      timezoneOptions: [
        {
          value: "Europe/Moscow",
          label: "Москва — Europe/Moscow (UTC+03:00)",
        },
      ],
      onFinish: vi.fn(),
    });
  });

  it("использует h1, App message context и не создаёт вложенный main", () => {
    const { container } = renderRegisterClient();

    expect(screen.getByRole("heading", { level: 1, name: REGISTER_TEXT.title })).toBeTruthy();
    expect(screen.getByRole("form", { name: REGISTER_TEXT.formLabel })).toBeTruthy();
    expect(useRegisterFormMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(Function),
        success: expect.any(Function),
        warning: expect.any(Function),
      })
    );
    expect(container.querySelector("main")).toBeNull();
  });

  it("показывает состояние без приглашения вместо формы", () => {
    useRegisterFormMock.mockReturnValue({
      loading: false,
      hasInvite: false,
      timezoneOptions: [],
      onFinish: vi.fn(),
    });

    renderRegisterClient();

    expect(screen.getByRole("region", { name: REGISTER_TEXT.inviteNoticeTitle })).toBeTruthy();
    expect(screen.queryByRole("form", { name: REGISTER_TEXT.formLabel })).toBeNull();
  });
});
