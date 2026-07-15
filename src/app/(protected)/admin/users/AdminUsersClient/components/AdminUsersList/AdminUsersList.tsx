"use client";

import { SearchOutlined, TeamOutlined, UserAddOutlined } from "@ant-design/icons";
import { Button, Pagination } from "antd";
import Link from "next/link";
import { ADMIN_USERS_LABELS, ADMIN_USERS_PAGE_SIZE } from "../../constants/adminUsersConstants";
import type { AdminUserRow, OpenAdminUserModal } from "../../types/adminUsersTypes";
import { AdminUserCard } from "../AdminUserCard/AdminUserCard";
import styles from "./AdminUsersList.module.scss";

type AdminUsersListProps = {
  users: AdminUserRow[];
  totalResults: number;
  currentPage: number;
  currentUserId: number | null;
  hasActiveFilters: boolean;
  savingStatusId: number | null;
  clearingUserDataId: number | null;
  deletingUserId: number | null;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
  onOpenRoleModal: OpenAdminUserModal;
  onOpenPasswordModal: OpenAdminUserModal;
  onStatusToggle: (user: AdminUserRow) => void;
  onClearUserTrainingData: (user: AdminUserRow) => void;
  onDeleteUser: (user: AdminUserRow) => void;
};

export function AdminUsersList({
  users,
  totalResults,
  currentPage,
  currentUserId,
  hasActiveFilters,
  savingStatusId,
  clearingUserDataId,
  deletingUserId,
  onPageChange,
  onResetFilters,
  onOpenRoleModal,
  onOpenPasswordModal,
  onStatusToggle,
  onClearUserTrainingData,
  onDeleteUser,
}: AdminUsersListProps) {
  if (users.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon} aria-hidden>
          {hasActiveFilters ? <SearchOutlined /> : <TeamOutlined />}
        </span>
        <h3 className={styles.emptyTitle}>
          {hasActiveFilters
            ? ADMIN_USERS_LABELS.emptySearchTitle
            : ADMIN_USERS_LABELS.emptyUsersTitle}
        </h3>
        <p className={styles.emptyText}>
          {hasActiveFilters
            ? ADMIN_USERS_LABELS.emptySearchText
            : ADMIN_USERS_LABELS.emptyUsersText}
        </p>
        {hasActiveFilters ? (
          <Button onClick={onResetFilters}>{ADMIN_USERS_LABELS.resetFiltersButton}</Button>
        ) : (
          <Link href="/admin/invites" className={styles.emptyAction}>
            <UserAddOutlined aria-hidden />
            <span>{ADMIN_USERS_LABELS.invitesButton}</span>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={styles.directory}>
      <ul className={styles.list}>
        {users.map((user) => (
          <li key={user.id} className={styles.listItem}>
            <AdminUserCard
              user={user}
              currentUserId={currentUserId}
              savingStatusId={savingStatusId}
              clearingUserDataId={clearingUserDataId}
              deletingUserId={deletingUserId}
              onOpenRoleModal={onOpenRoleModal}
              onOpenPasswordModal={onOpenPasswordModal}
              onStatusToggle={onStatusToggle}
              onClearUserTrainingData={onClearUserTrainingData}
              onDeleteUser={onDeleteUser}
            />
          </li>
        ))}
      </ul>

      {totalResults > ADMIN_USERS_PAGE_SIZE ? (
        <nav className={styles.pagination} aria-label="Страницы списка пользователей">
          <Pagination
            current={currentPage}
            total={totalResults}
            pageSize={ADMIN_USERS_PAGE_SIZE}
            showSizeChanger={false}
            showLessItems
            onChange={onPageChange}
          />
        </nav>
      ) : null}
    </div>
  );
}
