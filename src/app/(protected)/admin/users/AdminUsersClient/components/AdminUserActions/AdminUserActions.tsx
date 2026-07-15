"use client";

import {
  CheckCircleOutlined,
  ClearOutlined,
  DeleteOutlined,
  EllipsisOutlined,
  FlagOutlined,
  LockOutlined,
  StopOutlined,
  TrophyOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, type MenuProps } from "antd";
import Link from "next/link";
import { useRef } from "react";
import { ADMIN_USERS_LABELS } from "../../constants/adminUsersConstants";
import type { AdminUserRow, OpenAdminUserModal } from "../../types/adminUsersTypes";
import { canDeleteAdminUser, getRosterNumber, getUserLabel } from "../../utils/adminUsersUtils";
import styles from "./AdminUserActions.module.scss";

type AdminUserActionsProps = {
  user: AdminUserRow;
  isCurrentUser: boolean;
  savingStatusId: number | null;
  clearingUserDataId: number | null;
  deletingUserId: number | null;
  onOpenRoleModal: OpenAdminUserModal;
  onOpenPasswordModal: OpenAdminUserModal;
  onStatusToggle: (user: AdminUserRow) => void;
  onClearUserTrainingData: (user: AdminUserRow) => void;
  onDeleteUser: (user: AdminUserRow) => void;
};

export function AdminUserActions({
  user,
  isCurrentUser,
  savingStatusId,
  clearingUserDataId,
  deletingUserId,
  onOpenRoleModal,
  onOpenPasswordModal,
  onStatusToggle,
  onClearUserTrainingData,
  onDeleteUser,
}: AdminUserActionsProps) {
  const actionTriggerRef = useRef<HTMLElement | null>(null);
  const userLabel = getUserLabel(user);
  const isStatusSaving = savingStatusId === user.id;
  const isClearingUserData = clearingUserDataId === user.id;
  const isDeletingUser = deletingUserId === user.id;
  const isActionLoading = isStatusSaving || isClearingUserData || isDeletingUser;
  const cannotDisableCurrentUser = isCurrentUser && user.isActive;
  const statusLabel = user.isActive
    ? ADMIN_USERS_LABELS.disableButton
    : ADMIN_USERS_LABELS.enableButton;
  const statusIcon = user.isActive ? <StopOutlined /> : <CheckCircleOutlined />;
  const menuItems: MenuProps["items"] = [
    {
      key: "role",
      icon: <UserSwitchOutlined />,
      label: ADMIN_USERS_LABELS.roleButton,
      onClick: () => {
        onOpenRoleModal(user, () => {
          actionTriggerRef.current?.focus();
        });
      },
    },
    {
      key: "password",
      icon: <LockOutlined />,
      label: ADMIN_USERS_LABELS.passwordButton,
      onClick: () => {
        onOpenPasswordModal(user, () => {
          actionTriggerRef.current?.focus();
        });
      },
    },
    {
      key: "status",
      danger: user.isActive,
      disabled: isStatusSaving || cannotDisableCurrentUser,
      icon: statusIcon,
      label: cannotDisableCurrentUser
        ? `${statusLabel} (${ADMIN_USERS_LABELS.currentUserBadge.toLocaleLowerCase("ru-RU")})`
        : statusLabel,
      onClick: () => {
        onStatusToggle(user);
      },
    },
    {
      type: "divider",
    },
    {
      key: "clear-training-data",
      danger: true,
      disabled: isClearingUserData,
      icon: <ClearOutlined />,
      label: ADMIN_USERS_LABELS.clearTrainingDataButton,
      onClick: () => {
        onClearUserTrainingData(user);
      },
    },
    {
      key: "delete",
      danger: true,
      disabled: !canDeleteAdminUser(user) || isDeletingUser,
      icon: <DeleteOutlined />,
      label: ADMIN_USERS_LABELS.deleteButton,
      onClick: () => {
        onDeleteUser(user);
      },
    },
  ];
  const actionsLabel = `${ADMIN_USERS_LABELS.actionsMenuButton}: ${userLabel}, ${ADMIN_USERS_LABELS.rosterNumberLabel.toLocaleLowerCase("ru-RU")} ${getRosterNumber(user.id)}`;

  return (
    <footer className={styles.actions}>
      <Link href={`/admin/users/${user.id}/records`} className={styles.actionLink}>
        <TrophyOutlined aria-hidden />
        <span>{ADMIN_USERS_LABELS.recordsButton}</span>
      </Link>
      <Link href={`/admin/users/${user.id}/competitions`} className={styles.actionLink}>
        <FlagOutlined aria-hidden />
        <span>{ADMIN_USERS_LABELS.competitionsButton}</span>
      </Link>
      <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
        <Button
          className={styles.menuButton}
          aria-label={actionsLabel}
          title={actionsLabel}
          aria-haspopup="menu"
          icon={<EllipsisOutlined />}
          loading={isActionLoading}
          onClick={(event) => {
            actionTriggerRef.current = event.currentTarget;
          }}
        />
      </Dropdown>
    </footer>
  );
}
