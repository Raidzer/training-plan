import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { App, ConfigProvider } from "antd";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const profileComponentMocks = vi.hoisted(() => ({
  signOutMock: vi.fn(),
  telegramLinkPanelMock: vi.fn(),
  updateMock: vi.fn(),
  useSessionMock: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signOut: profileComponentMocks.signOutMock,
  useSession: profileComponentMocks.useSessionMock,
}));

vi.mock("@/components/EmailVerificationBanner", () => ({
  EmailVerificationBanner: () => <div data-testid="email-verification-banner" />,
}));

vi.mock("@/components/TelegramLinkPanel/TelegramLinkPanel", () => ({
  TelegramLinkPanel: (props: { showHeader?: boolean }) => {
    profileComponentMocks.telegramLinkPanelMock(props);
    return <div data-testid="telegram-link-panel">Настройки Telegram</div>;
  },
}));

import { ProfileClient } from "@/app/(protected)/profile/ProfileClient/ProfileClient";
import {
  PROFILE_LABELS,
  PROFILE_NAV_ITEMS,
} from "@/app/(protected)/profile/ProfileClient/constants/profileConstants";
import type { ProfileUserData } from "@/app/(protected)/profile/ProfileClient/types/profileTypes";

const originalGetComputedStyle = window.getComputedStyle.bind(window);

function createUserData(overrides: Partial<ProfileUserData> = {}): ProfileUserData {
  return {
    id: "1",
    email: "runner@example.com",
    login: "runner",
    name: "Иван",
    lastName: "Петров",
    patronymic: "Иванович",
    heightCm: 180,
    weeklyWorkloadCount: 5,
    gender: "male",
    dateOfBirth: "1990-04-12",
    occupation: "work",
    miscellaneous: "Бег по выходным",
    timezone: "Europe/Moscow",
    role: "athlete",
    ...overrides,
  };
}

function mockSession(emailVerified: string | null = "2026-01-01T00:00:00.000Z") {
  profileComponentMocks.useSessionMock.mockReturnValue({
    data: {
      user: {
        emailVerified,
      },
    },
    update: profileComponentMocks.updateMock,
  });
}

function renderProfile(userData = createUserData()) {
  return render(
    <ConfigProvider theme={{ token: { motion: false } }}>
      <App>
        <ProfileClient userData={userData} />
      </App>
    </ConfigProvider>
  );
}

describe("ProfileClient", { timeout: 15_000 }, () => {
  beforeAll(() => {
    vi.spyOn(window, "getComputedStyle").mockImplementation((element) => {
      return originalGetComputedStyle(element);
    });
  });

  beforeEach(() => {
    mockSession();
    profileComponentMocks.updateMock.mockResolvedValue(undefined);
    profileComponentMocks.signOutMock.mockResolvedValue(undefined);
    vi.stubGlobal("fetch", vi.fn() as unknown as typeof fetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("показывает структуру профиля и доступные настройки спортсмена", () => {
    renderProfile();

    expect(screen.getByRole("heading", { level: 1, name: PROFILE_LABELS.title })).toBeTruthy();

    const backLink = screen.getByRole("link", { name: PROFILE_LABELS.backButton });
    expect(backLink.getAttribute("href")).toBe("/dashboard");
    expect(backLink.querySelector("button")).toBeNull();

    expect(screen.getByRole("complementary", { name: "Иван Петров" })).toBeTruthy();
    expect(screen.getByText("@runner")).toBeTruthy();
    expect(
      screen.getByRole("navigation", { name: PROFILE_LABELS.sectionNavigationLabel })
    ).toBeTruthy();
    for (const item of PROFILE_NAV_ITEMS) {
      const navigationLink = screen.getByRole("link", { name: item.label });
      expect(navigationLink.getAttribute("href")).toBe(`#${item.id}`);
    }

    expect(screen.getByRole("region", { name: PROFILE_LABELS.personalSectionTitle })).toBeTruthy();
    expect(screen.getByRole("region", { name: PROFILE_LABELS.trainingSectionTitle })).toBeTruthy();
    expect(screen.getByRole("region", { name: PROFILE_LABELS.telegramSectionTitle })).toBeTruthy();
    expect(screen.getByRole("region", { name: PROFILE_LABELS.securitySectionTitle })).toBeTruthy();

    expect((screen.getByRole("textbox", { name: /Имя/ }) as HTMLInputElement).value).toBe("Иван");
    expect((screen.getByRole("textbox", { name: /Фамилия/ }) as HTMLInputElement).value).toBe(
      "Петров"
    );
    expect(screen.getByRole("textbox", { name: /Отчество/ })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: /Пол/ })).toBeTruthy();
    expect((screen.getByRole("textbox", { name: /Дата рождения/ }) as HTMLInputElement).value).toBe(
      "12.04.1990"
    );
    expect(screen.getByRole("combobox", { name: /Занятость/ })).toBeTruthy();
    expect(
      (screen.getByRole("spinbutton", { name: PROFILE_LABELS.heightCmLabel }) as HTMLInputElement)
        .value
    ).toBe("180");
    expect(
      (
        screen.getByRole("spinbutton", {
          name: PROFILE_LABELS.weeklyWorkloadCountLabel,
        }) as HTMLInputElement
      ).value
    ).toBe("5");
    expect(
      (
        screen.getByRole("textbox", {
          name: PROFILE_LABELS.miscellaneousLabel,
        }) as HTMLTextAreaElement
      ).value
    ).toBe("Бег по выходным");
    expect(screen.getByRole("combobox", { name: /Часовой пояс/ })).toBeTruthy();

    expect(screen.getByText("runner@example.com")).toBeTruthy();
    expect(screen.getByText(PROFILE_LABELS.emailVerifiedStatus)).toBeTruthy();
    expect(screen.getByTestId("email-verification-banner")).toBeTruthy();
    expect(screen.getByTestId("telegram-link-panel")).toBeTruthy();
    expect(profileComponentMocks.telegramLinkPanelMock.mock.calls[0]?.[0]).toEqual({
      showHeader: false,
    });

    const saveButton = screen.getByRole("button", { name: PROFILE_LABELS.saveButton });
    expect((saveButton as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(PROFILE_LABELS.savedState)).toBeTruthy();
    expect(screen.getByRole("button", { name: PROFILE_LABELS.deleteProfileButton })).toBeTruthy();
  });

  it("валидирует обязательное имя и сохраняет корректное изменение", async () => {
    renderProfile();

    const nameInput = screen.getByRole("textbox", { name: /Имя/ });
    const saveButton = screen.getByRole("button", { name: PROFILE_LABELS.saveButton });

    fireEvent.change(nameInput, { target: { value: "Анна" } });

    expect((saveButton as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByText(PROFILE_LABELS.dirtyState)).toBeTruthy();

    const confirmMock = vi.fn().mockReturnValue(false);
    vi.stubGlobal("confirm", confirmMock);
    fireEvent.click(screen.getByRole("link", { name: PROFILE_LABELS.backButton }));
    expect(confirmMock).toHaveBeenCalledWith(PROFILE_LABELS.leaveConfirmation);

    fireEvent.change(nameInput, { target: { value: "" } });
    fireEvent.click(saveButton);

    expect(await screen.findByText(PROFILE_LABELS.requiredName)).toBeTruthy();
    expect(global.fetch).not.toHaveBeenCalled();

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          user: createUserData({ name: "Анна" }),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    fireEvent.change(nameInput, { target: { value: "Анна" } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/setDataUser",
        expect.objectContaining({ method: "PATCH" })
      );
      expect(profileComponentMocks.updateMock).toHaveBeenCalled();
      expect((saveButton as HTMLButtonElement).disabled).toBe(true);
    });
    expect(screen.getByText(PROFILE_LABELS.savedState)).toBeTruthy();
  });

  it("открывает и закрывает окно изменения почты", async () => {
    renderProfile();

    fireEvent.click(screen.getByRole("button", { name: PROFILE_LABELS.changeEmailButton }));
    const emailDialog = await screen.findByRole("dialog", {
      name: PROFILE_LABELS.emailModalTitle,
    });
    expect(
      (within(emailDialog).getByRole("textbox", { name: /Новая почта/ }) as HTMLInputElement).value
    ).toBe("runner@example.com");
    const currentPasswordInput = within(emailDialog).getByLabelText(
      PROFILE_LABELS.currentPasswordLabel
    );
    expect(currentPasswordInput).toBeTruthy();
    expect(
      within(emailDialog).getByRole("button", { name: PROFILE_LABELS.saveButton })
    ).toBeTruthy();
    fireEvent.keyDown(currentPasswordInput, { key: "Enter" });
    expect(
      await within(emailDialog).findByText(PROFILE_LABELS.requiredCurrentPassword)
    ).toBeTruthy();
    fireEvent.click(within(emailDialog).getByRole("button", { name: PROFILE_LABELS.cancelButton }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: PROFILE_LABELS.emailModalTitle })).toBeNull();
    });
  });

  it("открывает окно изменения пароля", async () => {
    renderProfile();

    fireEvent.click(screen.getByRole("button", { name: PROFILE_LABELS.changePasswordButton }));
    const passwordDialog = await screen.findByRole("dialog", {
      name: PROFILE_LABELS.passwordModalTitle,
    });
    expect(within(passwordDialog).getByLabelText(PROFILE_LABELS.currentPasswordLabel)).toBeTruthy();
    expect(within(passwordDialog).getByLabelText(PROFILE_LABELS.newPasswordLabel)).toBeTruthy();
    expect(within(passwordDialog).getByLabelText(PROFILE_LABELS.confirmPasswordLabel)).toBeTruthy();
    expect(
      within(passwordDialog).getByRole("button", { name: PROFILE_LABELS.saveButton })
    ).toBeTruthy();
  });

  it("открывает подтверждение удаления профиля", async () => {
    renderProfile();

    fireEvent.click(screen.getByRole("button", { name: PROFILE_LABELS.deleteProfileButton }));
    const deleteDialog = await screen.findByRole("dialog", {
      name: PROFILE_LABELS.deleteProfileTitle,
    });
    expect(within(deleteDialog).getByText(PROFILE_LABELS.deleteProfileConfirmText)).toBeTruthy();
    expect(within(deleteDialog).getByLabelText(PROFILE_LABELS.currentPasswordLabel)).toBeTruthy();
    expect(
      within(deleteDialog).getByRole("button", { name: PROFILE_LABELS.deleteProfileOk })
    ).toBeTruthy();
  });

  it("скрывает удаление для администратора и показывает видимый статус почты", () => {
    mockSession(null);
    renderProfile(createUserData({ role: "admin" }));

    expect(screen.getByText("Администратор")).toBeTruthy();
    expect(screen.getByText(PROFILE_LABELS.emailUnverifiedStatus)).toBeTruthy();
    expect(screen.queryByRole("button", { name: PROFILE_LABELS.deleteProfileButton })).toBeNull();
    expect(screen.queryByRole("link", { name: "Удаление" })).toBeNull();
  });
});
