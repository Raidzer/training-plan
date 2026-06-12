"use client";

import { Form } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import type { HookAPI as ModalHookAPI } from "antd/es/modal/useModal";
import { useState } from "react";
import { ADMIN_USERS_LABELS } from "../constants/adminUsersConstants";
import type { AdminUserRow, PasswordFormValues, RoleFormValues } from "../types/adminUsersTypes";
import { canDeleteAdminUser, getApiErrorMessage, getUserLabel } from "../utils/adminUsersUtils";

type UseAdminUsersParams = {
  users: AdminUserRow[];
  messageApi: MessageInstance;
  modalApi: ModalHookAPI;
};

export const useAdminUsers = ({ users, messageApi, modalApi }: UseAdminUsersParams) => {
  const [roleForm] = Form.useForm<RoleFormValues>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();
  const [rows, setRows] = useState<AdminUserRow[]>(users);
  const [activeUser, setActiveUser] = useState<AdminUserRow | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingStatusId, setSavingStatusId] = useState<number | null>(null);
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
      const response = await fetch(`/api/admin/users/${activeUser.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: values.role }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        messageApi.error(getApiErrorMessage(data, ADMIN_USERS_LABELS.roleUpdateFail));
        return;
      }

      updateRow(activeUser.id, { role: values.role });
      messageApi.success(ADMIN_USERS_LABELS.roleUpdateOk);
      closeRoleModal();
    } catch {
      return;
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
      const response = await fetch(`/api/admin/users/${activeUser.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: values.newPassword }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        messageApi.error(getApiErrorMessage(data, ADMIN_USERS_LABELS.passwordUpdateFail));
        return;
      }

      messageApi.success(ADMIN_USERS_LABELS.passwordUpdateOk);
      closePasswordModal();
    } catch {
      return;
    } finally {
      setSavingPassword(false);
    }
  };

  const updateUserStatus = async (user: AdminUserRow, isActive: boolean) => {
    setSavingStatusId(user.id);

    try {
      const response = await fetch(`/api/admin/users/${user.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        messageApi.error(getApiErrorMessage(data, ADMIN_USERS_LABELS.statusUpdateFail));
        return;
      }

      updateRow(user.id, { isActive });
      messageApi.success(
        isActive ? ADMIN_USERS_LABELS.userEnabled : ADMIN_USERS_LABELS.userDisabled
      );
    } catch {
      messageApi.error(ADMIN_USERS_LABELS.statusUpdateFail);
    } finally {
      setSavingStatusId(null);
    }
  };

  const deleteUser = async (user: AdminUserRow) => {
    setDeletingUserId(user.id);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        messageApi.error(getApiErrorMessage(data, ADMIN_USERS_LABELS.deleteUpdateFail));
        return;
      }

      setRows((prev) => prev.filter((row) => row.id !== user.id));
      messageApi.success(ADMIN_USERS_LABELS.deleteUpdateOk);
    } catch {
      messageApi.error(ADMIN_USERS_LABELS.deleteUpdateFail);
    } finally {
      setDeletingUserId(null);
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

  const handleDeleteUser = (user: AdminUserRow) => {
    if (!canDeleteAdminUser(user)) {
      messageApi.error(ADMIN_USERS_LABELS.cannotDeleteAdmin);
      return;
    }

    confirmDeleteUser(user);
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
    deletingUserId,
    openRoleModal,
    openPasswordModal,
    closeRoleModal,
    closePasswordModal,
    handleRoleSubmit,
    handlePasswordSubmit,
    handleStatusToggle,
    handleDeleteUser,
  };
};
