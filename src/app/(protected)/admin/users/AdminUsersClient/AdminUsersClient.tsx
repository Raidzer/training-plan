"use client";

import { App } from "antd";
import { useRef } from "react";
import { AdminUsersFilters } from "./components/AdminUsersFilters/AdminUsersFilters";
import { AdminUsersHeader } from "./components/AdminUsersHeader/AdminUsersHeader";
import { AdminUsersList } from "./components/AdminUsersList/AdminUsersList";
import { AdminUsersOverview } from "./components/AdminUsersOverview/AdminUsersOverview";
import { PasswordModal } from "./components/PasswordModal/PasswordModal";
import { RoleModal } from "./components/RoleModal/RoleModal";
import { ADMIN_USERS_LABELS } from "./constants/adminUsersConstants";
import { useAdminUsers } from "./hooks/useAdminUsers";
import { useAdminUsersDirectory } from "./hooks/useAdminUsersDirectory";
import type {
  AdminUserRow,
  AdminUsersClientProps,
  RestoreAdminUserFocus,
} from "./types/adminUsersTypes";
import { getUserLabel } from "./utils/adminUsersUtils";
import styles from "./AdminUsersClient.module.scss";

export function AdminUsersClient({ users, currentUserId }: AdminUsersClientProps) {
  const { message: messageApi, modal: modalApi } = App.useApp();
  const restoreFocusRef = useRef<RestoreAdminUserFocus | null>(null);
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
  } = useAdminUsers({ users, messageApi, modalApi });
  const {
    query,
    roleFilter,
    statusFilter,
    stats,
    visibleUsers,
    filteredUsersCount,
    currentPage,
    hasActiveFilters,
    isSearchPending,
    updateQuery,
    updateRoleFilter,
    updateStatusFilter,
    updatePage,
    resetFilters,
  } = useAdminUsersDirectory(rows);

  const activeUserLabel = activeUser ? getUserLabel(activeUser) : "пользователя";

  const handleOpenRoleModal = (user: AdminUserRow, restoreFocus: RestoreAdminUserFocus) => {
    restoreFocusRef.current = restoreFocus;
    openRoleModal(user);
  };

  const handleOpenPasswordModal = (user: AdminUserRow, restoreFocus: RestoreAdminUserFocus) => {
    restoreFocusRef.current = restoreFocus;
    openPasswordModal(user);
  };

  const restoreActionFocus = () => {
    restoreFocusRef.current?.();
    restoreFocusRef.current = null;
  };

  return (
    <div className={styles.page}>
      <AdminUsersHeader />
      <AdminUsersOverview stats={stats} />

      <section className={styles.directory} aria-labelledby="admin-users-directory-title">
        <div className={styles.directoryHeader}>
          <h2 id="admin-users-directory-title" className={styles.directoryTitle}>
            {ADMIN_USERS_LABELS.directoryTitle}
          </h2>
          <p className={styles.directorySubtitle}>{ADMIN_USERS_LABELS.directorySubtitle}</p>
        </div>

        <AdminUsersFilters
          query={query}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          resultsCount={filteredUsersCount}
          hasActiveFilters={hasActiveFilters}
          isSearchPending={isSearchPending}
          onQueryChange={updateQuery}
          onRoleFilterChange={updateRoleFilter}
          onStatusFilterChange={updateStatusFilter}
          onReset={resetFilters}
        />
        <AdminUsersList
          users={visibleUsers}
          totalResults={filteredUsersCount}
          currentPage={currentPage}
          currentUserId={currentUserId}
          hasActiveFilters={hasActiveFilters}
          savingStatusId={savingStatusId}
          clearingUserDataId={clearingUserDataId}
          deletingUserId={deletingUserId}
          onPageChange={updatePage}
          onResetFilters={resetFilters}
          onOpenRoleModal={handleOpenRoleModal}
          onOpenPasswordModal={handleOpenPasswordModal}
          onStatusToggle={handleStatusToggle}
          onClearUserTrainingData={handleClearUserTrainingData}
          onDeleteUser={handleDeleteUser}
        />
      </section>

      <RoleModal
        form={roleForm}
        open={roleModalOpen}
        activeUserLabel={activeUserLabel}
        saving={savingRole}
        hasActiveUser={Boolean(activeUser)}
        onSubmit={handleRoleSubmit}
        onCancel={closeRoleModal}
        onAfterClose={restoreActionFocus}
      />
      <PasswordModal
        form={passwordForm}
        open={passwordModalOpen}
        activeUserLabel={activeUserLabel}
        saving={savingPassword}
        hasActiveUser={Boolean(activeUser)}
        onSubmit={handlePasswordSubmit}
        onCancel={closePasswordModal}
        onAfterClose={restoreActionFocus}
      />
    </div>
  );
}
