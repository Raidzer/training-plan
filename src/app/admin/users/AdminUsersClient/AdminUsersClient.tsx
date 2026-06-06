"use client";

import { HomeOutlined, LinkOutlined } from "@ant-design/icons";
import { App, Button, Card } from "antd";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { AdminUsersTable } from "./components/AdminUsersTable/AdminUsersTable";
import { PasswordModal } from "./components/PasswordModal/PasswordModal";
import { RoleModal } from "./components/RoleModal/RoleModal";
import { ADMIN_USERS_LABELS } from "./constants/adminUsersConstants";
import { useAdminUsers } from "./hooks/useAdminUsers";
import type { AdminUsersClientProps } from "./types/adminUsersTypes";
import { getUserLabel } from "./utils/adminUsersUtils";
import styles from "./AdminUsersClient.module.scss";

export function AdminUsersClient({ users }: AdminUsersClientProps) {
  const { message: messageApi, modal: modalApi } = App.useApp();
  const {
    rows,
    roleForm,
    passwordForm,
    activeUser,
    roleModalOpen,
    passwordModalOpen,
    savingRole,
    savingPassword,
    savingStatusId,
    openRoleModal,
    openPasswordModal,
    closeRoleModal,
    closePasswordModal,
    handleRoleSubmit,
    handlePasswordSubmit,
    handleStatusToggle,
  } = useAdminUsers({ users, messageApi, modalApi });

  const activeUserLabel = activeUser ? getUserLabel(activeUser) : "пользователя";

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <PageHeader
          className={styles.pageHeader}
          title={ADMIN_USERS_LABELS.title}
          subtitle={ADMIN_USERS_LABELS.subtitle}
          actions={
            <>
              <Link href="/admin/invites" passHref>
                <Button icon={<LinkOutlined />}>{ADMIN_USERS_LABELS.invitesButton}</Button>
              </Link>
              <Link href="/dashboard" passHref>
                <Button icon={<HomeOutlined />}>{ADMIN_USERS_LABELS.dashboardButton}</Button>
              </Link>
            </>
          }
        />
        <AdminUsersTable
          rows={rows}
          savingStatusId={savingStatusId}
          onOpenRoleModal={openRoleModal}
          onOpenPasswordModal={openPasswordModal}
          onStatusToggle={handleStatusToggle}
        />
        <RoleModal
          form={roleForm}
          open={roleModalOpen}
          activeUserLabel={activeUserLabel}
          saving={savingRole}
          hasActiveUser={Boolean(activeUser)}
          onSubmit={handleRoleSubmit}
          onCancel={closeRoleModal}
        />
        <PasswordModal
          form={passwordForm}
          open={passwordModalOpen}
          activeUserLabel={activeUserLabel}
          saving={savingPassword}
          hasActiveUser={Boolean(activeUser)}
          onSubmit={handlePasswordSubmit}
          onCancel={closePasswordModal}
        />
      </Card>
    </div>
  );
}
