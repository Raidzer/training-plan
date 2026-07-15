"use client";

import { App, Form } from "antd";
import { useState } from "react";
import { ADMIN_USERS_LABELS } from "../constants/adminUsersConstants";
import {
  AdminUsersApiError,
  clearAdminUserTrainingData,
  deleteAdminUser,
  updateAdminUserPassword,
  updateAdminUserRole,
  updateAdminUserStatus,
} from "../services/adminUsersApi";
import type { AdminUserRow, PasswordFormValues, RoleFormValues } from "../types/adminUsersTypes";
import { canDeleteAdminUser, getApiErrorMessage, getUserLabel } from "../utils/adminUsersUtils";

type UseAdminUsersParams = {
  users: AdminUserRow[];
  messageApi: ReturnType<typeof App.useApp>["message"];
  modalApi: ReturnType<typeof App.useApp>["modal"];
};

const isFormValidationError = (error: unknown) => {
  return Boolean(error && typeof error === "object" && "errorFields" in error);
};

const getRequestErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof AdminUsersApiError) {
    return getApiErrorMessage(error.responseData, fallback);
  }

  return fallback;
};

export function useAdminUsers({ users, messageApi, modalApi }: UseAdminUsersParams) {
  const [roleForm] = Form.useForm<RoleFormValues>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();
  const [rows, setRows] = useState<AdminUserRow[]>(users);
  const [activeUser, setActiveUser] = useState<AdminUserRow | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingStatusId, setSavingStatusId] = useState<number | null>(null);
  const [clearingUserDataId, setClearingUserDataId] = useState<number | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  const updateRow = (userId: number, patch: Partial<AdminUserRow>) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id === userId) {
          return { ...row, ...patch };
        }

        return row;
      })
    );
  };

  const openRoleModal = (user: AdminUserRow) => {
    setActiveUser(user);
    roleForm.setFieldsValue({ role: user.role });
    setRoleModalOpen(true);
  };

  const openPasswordModal = (user: AdminUserRow) => {
    setActiveUser(user);
    passwordForm.resetFields();
    setPasswordModalOpen(true);
  };

  const closeRoleModal = () => {
    setRoleModalOpen(false);
    setActiveUser(null);
    roleForm.resetFields();
  };

  const closePasswordModal = () => {
    setPasswordModalOpen(false);
    setActiveUser(null);
    passwordForm.resetFields();
  };

  const handleRoleSubmit = async () => {
    try {
      const values = await roleForm.validateFields();

      if (!activeUser) {
        messageApi.error(ADMIN_USERS_LABELS.roleUserMissing);
        return;
      }

      setSavingRole(true);
      await updateAdminUserRole(activeUser.id, values.role);

      updateRow(activeUser.id, { role: values.role });
      messageApi.success(ADMIN_USERS_LABELS.roleUpdateOk);
      closeRoleModal();
    } catch (error) {
      if (isFormValidationError(error)) {
        return;
      }

      messageApi.error(getRequestErrorMessage(error, ADMIN_USERS_LABELS.roleUpdateFail));
    } finally {
      setSavingRole(false);
    }
  };

  const handlePasswordSubmit = async () => {
    try {
      const values = await passwordForm.validateFields();

      if (!activeUser) {
        messageApi.error(ADMIN_USERS_LABELS.passwordUserMissing);
        return;
      }

      setSavingPassword(true);
      await updateAdminUserPassword(activeUser.id, values.newPassword);

      messageApi.success(ADMIN_USERS_LABELS.passwordUpdateOk);
      closePasswordModal();
    } catch (error) {
      if (isFormValidationError(error)) {
        return;
      }

      messageApi.error(getRequestErrorMessage(error, ADMIN_USERS_LABELS.passwordUpdateFail));
    } finally {
      setSavingPassword(false);
    }
  };

  const updateUserStatus = async (user: AdminUserRow, isActive: boolean) => {
    setSavingStatusId(user.id);

    try {
      await updateAdminUserStatus(user.id, isActive);

      updateRow(user.id, { isActive });
      messageApi.success(
        isActive ? ADMIN_USERS_LABELS.userEnabled : ADMIN_USERS_LABELS.userDisabled
      );
    } catch (error) {
      messageApi.error(getRequestErrorMessage(error, ADMIN_USERS_LABELS.statusUpdateFail));
    } finally {
      setSavingStatusId(null);
    }
  };

  const deleteUser = async (user: AdminUserRow) => {
    setDeletingUserId(user.id);

    try {
      await deleteAdminUser(user.id);

      setRows((prev) => prev.filter((row) => row.id !== user.id));
      messageApi.success(ADMIN_USERS_LABELS.deleteUpdateOk);
    } catch (error) {
      messageApi.error(getRequestErrorMessage(error, ADMIN_USERS_LABELS.deleteUpdateFail));
    } finally {
      setDeletingUserId(null);
    }
  };

  const clearUserTrainingData = async (user: AdminUserRow) => {
    setClearingUserDataId(user.id);

    try {
      await clearAdminUserTrainingData(user.id);

      messageApi.success(ADMIN_USERS_LABELS.clearTrainingDataUpdateOk);
    } catch (error) {
      messageApi.error(
        getRequestErrorMessage(error, ADMIN_USERS_LABELS.clearTrainingDataUpdateFail)
      );
    } finally {
      setClearingUserDataId(null);
    }
  };

  const confirmDisableUser = (user: AdminUserRow) => {
    const label = getUserLabel(user);
    modalApi.confirm({
      title: `${ADMIN_USERS_LABELS.disableButton} пользователя ${label}?`,
      content: ADMIN_USERS_LABELS.disableConfirmText,
      okText: ADMIN_USERS_LABELS.disableButton,
      okType: "danger",
      cancelText: ADMIN_USERS_LABELS.cancelButton,
      onOk: async () => {
        await updateUserStatus(user, false);
      },
    });
  };

  const handleStatusToggle = async (user: AdminUserRow) => {
    if (user.isActive) {
      confirmDisableUser(user);
      return;
    }

    await updateUserStatus(user, true);
  };

  const confirmDeleteUser = (user: AdminUserRow) => {
    const label = getUserLabel(user);
    modalApi.confirm({
      title: `${ADMIN_USERS_LABELS.deleteConfirmTitle} ${label}?`,
      content: ADMIN_USERS_LABELS.deleteConfirmText,
      okText: ADMIN_USERS_LABELS.deleteButton,
      okType: "danger",
      cancelText: ADMIN_USERS_LABELS.cancelButton,
      onOk: async () => {
        await deleteUser(user);
      },
    });
  };

  const confirmClearUserTrainingData = (user: AdminUserRow) => {
    const label = getUserLabel(user);
    modalApi.confirm({
      title: `${ADMIN_USERS_LABELS.clearTrainingDataConfirmTitle} ${label}?`,
      content: ADMIN_USERS_LABELS.clearTrainingDataConfirmText,
      okText: ADMIN_USERS_LABELS.clearTrainingDataButton,
      okType: "danger",
      cancelText: ADMIN_USERS_LABELS.cancelButton,
      onOk: async () => {
        await clearUserTrainingData(user);
      },
    });
  };

  const handleDeleteUser = (user: AdminUserRow) => {
    if (!canDeleteAdminUser(user)) {
      messageApi.error(ADMIN_USERS_LABELS.cannotDeleteAdmin);
      return;
    }

    confirmDeleteUser(user);
  };

  const handleClearUserTrainingData = (user: AdminUserRow) => {
    confirmClearUserTrainingData(user);
  };

  return {
    rows,
    roleForm,
    passwordForm,
    activeUser,
    roleModalOpen,
    passwordModalOpen,
    savingRole,
    savingPassword,
    savingStatusId,
    clearingUserDataId,
    deletingUserId,
    openRoleModal,
    openPasswordModal,
    closeRoleModal,
    closePasswordModal,
    handleRoleSubmit,
    handlePasswordSubmit,
    handleStatusToggle,
    handleClearUserTrainingData,
    handleDeleteUser,
  };
}
