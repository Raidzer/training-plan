import { act, renderHook } from "@testing-library/react";
import type { MessageInstance } from "antd/es/message/interface";
import { beforeEach, describe, expect, it, vi } from "vitest";

const profileSessionMocks = vi.hoisted(() => ({
  signOutMock: vi.fn(),
  updateMock: vi.fn(),
  useSessionMock: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signOut: profileSessionMocks.signOutMock,
  useSession: profileSessionMocks.useSessionMock,
}));

import { PROFILE_LABELS } from "@/app/(protected)/profile/ProfileClient/constants/profileConstants";
import { useProfileClient } from "@/app/(protected)/profile/ProfileClient/hooks/useProfileClient";
import type { ProfileUserData } from "@/app/(protected)/profile/ProfileClient/types/profileTypes";

function createMessageApi() {
  return {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  } as unknown as MessageInstance;
}

function createResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

function createUserData(overrides: Partial<ProfileUserData> = {}): ProfileUserData {
  return {
    id: "1",
    email: "runner@example.com",
    login: "runner",
    name: "Иван",
    lastName: "Петров",
    gender: "male",
    timezone: "Europe/Moscow",
    role: "athlete",
    ...overrides,
  };
}

function renderProfileHook(messageApi = createMessageApi()) {
  return {
    messageApi,
    ...renderHook(() =>
      useProfileClient({
        initialUserData: createUserData(),
        messageApi,
      })
    ),
  };
}

describe("useProfileClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profileSessionMocks.signOutMock.mockResolvedValue(undefined);
    profileSessionMocks.updateMock.mockResolvedValue(undefined);
    profileSessionMocks.useSessionMock.mockReturnValue({
      data: {
        user: {
          emailVerified: "2026-01-01T00:00:00.000Z",
        },
      },
      update: profileSessionMocks.updateMock,
    });
    global.fetch = vi.fn() as unknown as typeof fetch;
  });

  it("должен инициализировать состояние, отслеживать изменения и управлять модалками", () => {
    const { result } = renderProfileHook();

    expect(result.current.userData).toEqual(createUserData());
    expect(result.current.initialValues).toEqual({
      name: "Иван",
      lastName: "Петров",
      gender: "male",
      timezone: "Europe/Moscow",
    });
    expect(result.current.isEmailVerified).toBe(true);
    expect(result.current.hasProfileChanges).toBe(false);
    expect(result.current.timezoneOptions.some((option) => option.value === "Europe/Moscow")).toBe(
      true
    );

    act(() => {
      result.current.handleProfileValuesChange(
        {},
        {
          name: "Анна",
          lastName: "Петров",
          gender: "female",
          timezone: "Europe/Moscow",
        }
      );
    });

    expect(result.current.hasProfileChanges).toBe(true);

    act(() => {
      result.current.openPasswordModal();
    });
    expect(result.current.passwordModalOpen).toBe(true);

    act(() => {
      result.current.closePasswordModal();
    });
    expect(result.current.passwordModalOpen).toBe(false);

    act(() => {
      result.current.openEmailModal();
    });
    expect(result.current.emailModalOpen).toBe(true);
    expect(result.current.emailForm.getFieldValue("email")).toBe("runner@example.com");

    act(() => {
      result.current.closeEmailModal();
    });
    expect(result.current.emailModalOpen).toBe(false);

    expect(result.current.canDeleteProfile).toBe(true);

    act(() => {
      result.current.openDeleteProfileModal();
    });
    expect(result.current.deleteProfileModalOpen).toBe(true);

    act(() => {
      result.current.closeDeleteProfileModal();
    });
    expect(result.current.deleteProfileModalOpen).toBe(false);
  });

  it("должен сохранять профиль и обновлять сессию", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createResponse({
        success: true,
        user: createUserData({
          id: "2",
          name: "Анна",
          lastName: null as unknown as string,
          gender: "female",
          timezone: "Etc/UTC",
        }),
      })
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result, messageApi } = renderProfileHook();

    vi.spyOn(result.current.profileForm, "validateFields").mockResolvedValue({
      name: " Анна ",
      lastName: " ",
      gender: "female",
      timezone: "Etc/UTC",
    } as any);

    act(() => {
      result.current.profileForm.setFieldsValue({
        name: " Анна ",
        lastName: " ",
        gender: "female",
        timezone: "Etc/UTC",
      });
    });

    await act(async () => {
      await result.current.handleSaveProfile();
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(request.method).toBe("PATCH");
    expect(JSON.parse(String(request.body))).toEqual({
      name: "Анна",
      lastName: "",
      gender: "female",
      timezone: "Etc/UTC",
    });
    expect(result.current.userData).toEqual(
      expect.objectContaining({
        id: "2",
        name: "Анна",
        lastName: "",
      })
    );
    expect(profileSessionMocks.updateMock).toHaveBeenCalled();
    expect(messageApi.success).toHaveBeenCalledWith(PROFILE_LABELS.profileUpdateOk);
    expect(result.current.savingProfile).toBe(false);
  });

  it("должен показывать ошибки сохранения профиля", async () => {
    const { result, messageApi } = renderProfileHook();

    vi.spyOn(result.current.profileForm, "validateFields").mockResolvedValue({
      name: "Иван",
      lastName: "Петров",
      gender: "male",
      timezone: "Europe/Moscow",
    } as any);

    global.fetch = vi
      .fn()
      .mockResolvedValue(createResponse({ success: false }, 500)) as unknown as typeof fetch;

    await act(async () => {
      await result.current.handleSaveProfile();
    });

    expect(messageApi.error).toHaveBeenCalledWith(PROFILE_LABELS.profileUpdateFail);

    global.fetch = vi.fn().mockRejectedValue(new Error("network")) as unknown as typeof fetch;

    await act(async () => {
      await result.current.handleSaveProfile();
    });

    expect(messageApi.error).toHaveBeenCalledWith(PROFILE_LABELS.profileUpdateError);
  });

  it("должен менять пароль и обрабатывать ошибки", async () => {
    const { result, messageApi } = renderProfileHook();
    const setPasswordFieldsSpy = vi.spyOn(result.current.passwordForm, "setFields");

    vi.spyOn(result.current.passwordForm, "validateFields").mockResolvedValue({
      currentPassword: "old",
      newPassword: "new-secret",
      confirmPassword: "new-secret",
    } as any);

    act(() => {
      result.current.openPasswordModal();
      result.current.passwordForm.setFieldsValue({
        currentPassword: "old",
        newPassword: "new-secret",
        confirmPassword: "new-secret",
      });
    });

    global.fetch = vi
      .fn()
      .mockResolvedValue(
        createResponse({ error: "invalid_current_password" }, 403)
      ) as unknown as typeof fetch;

    await act(async () => {
      await result.current.handleChangePassword();
    });

    expect(setPasswordFieldsSpy).toHaveBeenCalledWith([
      {
        name: "currentPassword",
        errors: [PROFILE_LABELS.invalidCurrentPassword],
      },
    ]);

    global.fetch = vi
      .fn()
      .mockResolvedValue(createResponse({ success: false }, 500)) as unknown as typeof fetch;

    await act(async () => {
      await result.current.handleChangePassword();
    });

    expect(messageApi.error).toHaveBeenCalledWith(PROFILE_LABELS.passwordUpdateFail);

    global.fetch = vi
      .fn()
      .mockResolvedValue(createResponse({ success: true })) as unknown as typeof fetch;

    await act(async () => {
      await result.current.handleChangePassword();
    });

    expect(messageApi.success).toHaveBeenCalledWith(PROFILE_LABELS.passwordUpdateOk);
    expect(result.current.passwordModalOpen).toBe(false);

    global.fetch = vi.fn().mockRejectedValue(new Error("network")) as unknown as typeof fetch;

    await act(async () => {
      await result.current.handleChangePassword();
    });

    expect(messageApi.error).toHaveBeenCalledWith(PROFILE_LABELS.passwordUpdateError);
    expect(result.current.savingPassword).toBe(false);
  });

  it("должен менять email и обрабатывать специальные ошибки", async () => {
    const { result } = renderProfileHook();
    const setEmailFieldsSpy = vi.spyOn(result.current.emailForm, "setFields");

    vi.spyOn(result.current.emailForm, "validateFields").mockResolvedValue({
      email: "new@example.com",
      currentPassword: "secret",
    } as any);

    act(() => {
      result.current.openEmailModal();
      result.current.emailForm.setFieldsValue({
        email: "new@example.com",
        currentPassword: "secret",
      });
    });

    global.fetch = vi
      .fn()
      .mockResolvedValue(
        createResponse({ error: "invalid_current_password" }, 403)
      ) as unknown as typeof fetch;

    await act(async () => {
      await result.current.handleChangeEmail();
    });

    expect(setEmailFieldsSpy).toHaveBeenCalledWith([
      {
        name: "currentPassword",
        errors: [PROFILE_LABELS.invalidCurrentPassword],
      },
    ]);

    global.fetch = vi
      .fn()
      .mockResolvedValue(
        createResponse({ error: "email_conflict" }, 409)
      ) as unknown as typeof fetch;

    await act(async () => {
      await result.current.handleChangeEmail();
    });

    expect(setEmailFieldsSpy).toHaveBeenCalledWith([
      {
        name: "email",
        errors: [PROFILE_LABELS.emailConflict],
      },
    ]);

    global.fetch = vi
      .fn()
      .mockResolvedValue(
        createResponse({ error: "email_unchanged" }, 400)
      ) as unknown as typeof fetch;

    await act(async () => {
      await result.current.handleChangeEmail();
    });

    expect(setEmailFieldsSpy).toHaveBeenCalledWith([
      {
        name: "email",
        errors: [PROFILE_LABELS.emailUnchanged],
      },
    ]);
  });

  it("должен обновлять email, предупреждать без письма и показывать общие ошибки", async () => {
    const { result, messageApi } = renderProfileHook();

    vi.spyOn(result.current.emailForm, "validateFields").mockResolvedValue({
      email: "new@example.com",
      currentPassword: "secret",
    } as any);

    act(() => {
      result.current.openEmailModal();
      result.current.emailForm.setFieldsValue({
        email: "new@example.com",
        currentPassword: "secret",
      });
    });

    global.fetch = vi.fn().mockResolvedValue(
      createResponse({
        success: true,
        emailSent: true,
        user: createUserData({ id: "2", email: "new@example.com" }),
      })
    ) as unknown as typeof fetch;

    await act(async () => {
      await result.current.handleChangeEmail();
    });

    expect(result.current.emailModalOpen).toBe(false);
    expect(result.current.userData.email).toBe("new@example.com");
    expect(profileSessionMocks.updateMock).toHaveBeenCalled();
    expect(messageApi.success).toHaveBeenCalledWith(PROFILE_LABELS.emailUpdateOk);

    act(() => {
      result.current.openEmailModal();
      result.current.emailForm.setFieldsValue({
        email: "second@example.com",
        currentPassword: "secret",
      });
    });

    global.fetch = vi.fn().mockResolvedValue(
      createResponse({
        success: true,
        emailSent: false,
        user: createUserData({ id: "3", email: "second@example.com" }),
      })
    ) as unknown as typeof fetch;

    await act(async () => {
      await result.current.handleChangeEmail();
    });

    expect(messageApi.warning).toHaveBeenCalledWith(PROFILE_LABELS.emailUpdateWarning);

    global.fetch = vi
      .fn()
      .mockResolvedValue(createResponse({ success: false }, 500)) as unknown as typeof fetch;

    await act(async () => {
      await result.current.handleChangeEmail();
    });

    expect(messageApi.error).toHaveBeenCalledWith(PROFILE_LABELS.emailUpdateFail);

    global.fetch = vi.fn().mockRejectedValue(new Error("network")) as unknown as typeof fetch;

    await act(async () => {
      await result.current.handleChangeEmail();
    });

    expect(messageApi.error).toHaveBeenCalledWith(PROFILE_LABELS.emailUpdateError);
    expect(result.current.savingEmail).toBe(false);
  });

  it("должен удалять профиль и обрабатывать ошибки удаления", async () => {
    const { result, messageApi } = renderProfileHook();
    const setDeleteFieldsSpy = vi.spyOn(result.current.deleteProfileForm, "setFields");

    vi.spyOn(result.current.deleteProfileForm, "validateFields").mockResolvedValue({
      currentPassword: "secret",
    } as any);

    act(() => {
      result.current.openDeleteProfileModal();
      result.current.deleteProfileForm.setFieldsValue({
        currentPassword: "secret",
      });
    });

    global.fetch = vi
      .fn()
      .mockResolvedValue(
        createResponse({ error: "invalid_current_password" }, 403)
      ) as unknown as typeof fetch;

    await act(async () => {
      await result.current.handleDeleteProfile();
    });

    expect(setDeleteFieldsSpy).toHaveBeenCalledWith([
      {
        name: "currentPassword",
        errors: [PROFILE_LABELS.invalidCurrentPassword],
      },
    ]);
    expect(profileSessionMocks.signOutMock).not.toHaveBeenCalled();

    global.fetch = vi
      .fn()
      .mockResolvedValue(createResponse({ success: true })) as unknown as typeof fetch;

    await act(async () => {
      await result.current.handleDeleteProfile();
    });

    expect(result.current.deleteProfileModalOpen).toBe(false);
    expect(messageApi.success).toHaveBeenCalledWith(PROFILE_LABELS.deleteProfileSuccess);
    expect(profileSessionMocks.signOutMock).toHaveBeenCalledWith({ callbackUrl: "/login" });

    act(() => {
      result.current.openDeleteProfileModal();
    });

    global.fetch = vi
      .fn()
      .mockResolvedValue(createResponse({ error: "forbidden" }, 403)) as unknown as typeof fetch;

    await act(async () => {
      await result.current.handleDeleteProfile();
    });

    expect(messageApi.error).toHaveBeenCalledWith(PROFILE_LABELS.deleteProfileForbidden);

    global.fetch = vi.fn().mockRejectedValue(new Error("network")) as unknown as typeof fetch;

    await act(async () => {
      await result.current.handleDeleteProfile();
    });

    expect(messageApi.error).toHaveBeenCalledWith(PROFILE_LABELS.deleteProfileError);
    expect(result.current.deletingProfile).toBe(false);
  });
});
