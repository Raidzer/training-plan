import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const adminUserFormMocks = vi.hoisted(() => {
  let formCallIndex = 0;
  let roleStore: Record<string, unknown> = {};
  let passwordStore: Record<string, unknown> = {};

  const roleFormMock = {
    setFieldsValue: vi.fn((values: Record<string, unknown>) => {
      roleStore = {
        ...roleStore,
        ...values,
      };
    }),
    validateFields: vi.fn(() => Promise.resolve({ ...roleStore })),
    resetFields: vi.fn(() => {
      roleStore = {};
    }),
  };

  const passwordFormMock = {
    setFieldsValue: vi.fn((values: Record<string, unknown>) => {
      passwordStore = {
        ...passwordStore,
        ...values,
      };
    }),
    validateFields: vi.fn(() => Promise.resolve({ ...passwordStore })),
    resetFields: vi.fn(() => {
      passwordStore = {};
    }),
  };

  const useFormMock = vi.fn(() => {
    formCallIndex += 1;

    if (formCallIndex % 2 === 1) {
      return [roleFormMock];
    }

    return [passwordFormMock];
  });

  const reset = () => {
    formCallIndex = 0;
    roleStore = {};
    passwordStore = {};
  };

  return {
    passwordFormMock,
    reset,
    roleFormMock,
    useFormMock,
  };
});

vi.mock("antd", async () => {
  const actual = await vi.importActual<typeof import("antd")>("antd");

  return {
    ...actual,
    Form: {
      ...actual.Form,
      useForm: adminUserFormMocks.useFormMock,
    },
  };
});

import { ADMIN_USERS_LABELS } from "@/app/admin/users/AdminUsersClient/constants/adminUsersConstants";
import { useAdminUsers } from "@/app/admin/users/AdminUsersClient/hooks/useAdminUsers";
import type { AdminUserRow } from "@/app/admin/users/AdminUsersClient/types/adminUsersTypes";
import type { MessageInstance } from "antd/es/message/interface";
import type { HookAPI as ModalHookAPI } from "antd/es/modal/useModal";

function createMessageApi() {
  return {
    error: vi.fn(),
    success: vi.fn(),
  } as unknown as MessageInstance;
}

function createModalApi() {
  return {
    confirm: vi.fn(),
  } as unknown as ModalHookAPI;
}

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

function createUser(overrides: Partial<AdminUserRow> = {}): AdminUserRow {
  return {
    id: 1,
    name: "Иван",
    lastName: "Петров",
    gender: "male",
    email: "runner@example.com",
    login: "runner",
    role: "athlete",
    isActive: true,
    createdAt: "2026-05-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("useAdminUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminUserFormMocks.reset();
    global.fetch = vi.fn() as unknown as typeof fetch;
  });

  it("opens and closes role and password modals for selected user", () => {
    const user = createUser();
    const messageApi = createMessageApi();
    const modalApi = createModalApi();
    const { result } = renderHook(() =>
      useAdminUsers({
        users: [user],
        messageApi,
        modalApi,
      })
    );

    act(() => {
      result.current.openRoleModal(user);
    });

    expect(result.current.roleModalOpen).toBe(true);
    expect(result.current.activeUser).toEqual(user);

    act(() => {
      result.current.closeRoleModal();
      result.current.openPasswordModal(user);
    });

    expect(result.current.roleModalOpen).toBe(false);
    expect(result.current.passwordModalOpen).toBe(true);
    expect(result.current.activeUser).toEqual(user);

    act(() => {
      result.current.closePasswordModal();
    });

    expect(result.current.passwordModalOpen).toBe(false);
    expect(result.current.activeUser).toBeNull();
  });

  it("submits role update and patches row state", async () => {
    const user = createUser();
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ success: true }));
    global.fetch = fetchMock as unknown as typeof fetch;
    const messageApi = createMessageApi();
    const modalApi = createModalApi();
    const { result } = renderHook(() =>
      useAdminUsers({
        users: [user],
        messageApi,
        modalApi,
      })
    );

    act(() => {
      result.current.openRoleModal(user);
      result.current.roleForm.setFieldsValue({
        role: "coach",
      });
    });

    await act(async () => {
      await result.current.handleRoleSubmit();
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/users/1/role", expect.any(Object));
    expect(request.method).toBe("PATCH");
    expect(JSON.parse(String(request.body))).toEqual({ role: "coach" });
    expect(result.current.rows[0].role).toBe("coach");
    expect(result.current.roleModalOpen).toBe(false);
    expect(messageApi.success).toHaveBeenCalledWith(ADMIN_USERS_LABELS.roleUpdateOk);
  });

  it("submits password update without changing selected row data", async () => {
    const user = createUser();
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ success: true }));
    global.fetch = fetchMock as unknown as typeof fetch;
    const messageApi = createMessageApi();
    const modalApi = createModalApi();
    const { result } = renderHook(() =>
      useAdminUsers({
        users: [user],
        messageApi,
        modalApi,
      })
    );

    act(() => {
      result.current.openPasswordModal(user);
      result.current.passwordForm.setFieldsValue({
        newPassword: "secret123",
        confirmPassword: "secret123",
      });
    });

    await act(async () => {
      await result.current.handlePasswordSubmit();
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/users/1/password", expect.any(Object));
    expect(JSON.parse(String(request.body))).toEqual({ password: "secret123" });
    expect(result.current.rows[0]).toEqual(user);
    expect(result.current.passwordModalOpen).toBe(false);
    expect(messageApi.success).toHaveBeenCalledWith(ADMIN_USERS_LABELS.passwordUpdateOk);
  });

  it("enables inactive user directly", async () => {
    const user = createUser({
      isActive: false,
    });
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ success: true }));
    global.fetch = fetchMock as unknown as typeof fetch;
    const messageApi = createMessageApi();
    const modalApi = createModalApi();
    const { result } = renderHook(() =>
      useAdminUsers({
        users: [user],
        messageApi,
        modalApi,
      })
    );

    await act(async () => {
      await result.current.handleStatusToggle(user);
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/users/1/status", expect.any(Object));
    expect(JSON.parse(String(request.body))).toEqual({ isActive: true });
    expect(result.current.rows[0].isActive).toBe(true);
    expect(messageApi.success).toHaveBeenCalledWith(ADMIN_USERS_LABELS.userEnabled);
  });

  it("requires confirmation before disabling active user", async () => {
    const user = createUser();
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ success: true }));
    global.fetch = fetchMock as unknown as typeof fetch;
    const messageApi = createMessageApi();
    const modalApi = createModalApi();
    const confirmMock = modalApi.confirm as ReturnType<typeof vi.fn>;

    confirmMock.mockImplementation((options) => {
      void options.onOk?.();
      return undefined;
    });

    const { result } = renderHook(() =>
      useAdminUsers({
        users: [user],
        messageApi,
        modalApi,
      })
    );

    await act(async () => {
      await result.current.handleStatusToggle(user);
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/users/1/status", expect.any(Object));
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;

    expect(confirmMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(request.body))).toEqual({ isActive: false });
    expect(result.current.rows[0].isActive).toBe(false);
    expect(messageApi.success).toHaveBeenCalledWith(ADMIN_USERS_LABELS.userDisabled);
  });

  it("maps status API errors without mutating rows", async () => {
    const user = createUser({
      isActive: false,
    });
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse(
        {
          error: "cannot_disable_self",
        },
        400
      )
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    const messageApi = createMessageApi();
    const modalApi = createModalApi();
    const { result } = renderHook(() =>
      useAdminUsers({
        users: [user],
        messageApi,
        modalApi,
      })
    );

    await act(async () => {
      await result.current.handleStatusToggle(user);
    });

    expect(result.current.rows[0].isActive).toBe(false);
    expect(messageApi.error).toHaveBeenCalledWith(ADMIN_USERS_LABELS.cannotDisableSelf);
  });
});
