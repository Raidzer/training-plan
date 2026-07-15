"use client";

import { SearchOutlined, UserAddOutlined } from "@ant-design/icons";
import { Button, Pagination } from "antd";
import {
  ADMIN_INVITES_LABELS,
  ADMIN_INVITES_PAGE_SIZE,
} from "../../constants/adminInvitesConstants";
import type { AdminInviteRow } from "../../types/adminInvitesTypes";
import { AdminInviteCard } from "../AdminInviteCard/AdminInviteCard";
import styles from "./AdminInvitesList.module.scss";

type AdminInvitesListProps = {
  invites: AdminInviteRow[];
  tokenById: Record<number, string>;
  totalResults: number;
  currentPage: number;
  hasActiveFilters: boolean;
  onCopy: (value: string) => void;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
};

export function AdminInvitesList({
  invites,
  tokenById,
  totalResults,
  currentPage,
  hasActiveFilters,
  onCopy,
  onPageChange,
  onResetFilters,
}: AdminInvitesListProps) {
  if (invites.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon} aria-hidden>
          {hasActiveFilters ? <SearchOutlined /> : <UserAddOutlined />}
        </span>
        <h3 className={styles.emptyTitle}>
          {hasActiveFilters
            ? ADMIN_INVITES_LABELS.emptySearchTitle
            : ADMIN_INVITES_LABELS.emptyInvitesTitle}
        </h3>
        <p className={styles.emptyText}>
          {hasActiveFilters
            ? ADMIN_INVITES_LABELS.emptySearchText
            : ADMIN_INVITES_LABELS.emptyInvitesText}
        </p>
        {hasActiveFilters ? (
          <Button onClick={onResetFilters}>{ADMIN_INVITES_LABELS.resetFiltersButton}</Button>
        ) : (
          <a href="#admin-invite-create" className={styles.emptyAction}>
            <UserAddOutlined aria-hidden />
            <span>{ADMIN_INVITES_LABELS.createButton}</span>
          </a>
        )}
      </div>
    );
  }

  return (
    <div className={styles.directory}>
      <ul className={styles.list} role="list">
        {invites.map((invite) => (
          <li key={invite.id} className={styles.listItem}>
            <AdminInviteCard invite={invite} token={tokenById[invite.id]} onCopy={onCopy} />
          </li>
        ))}
      </ul>

      {totalResults > ADMIN_INVITES_PAGE_SIZE ? (
        <nav className={styles.pagination} aria-label="Страницы списка приглашений">
          <Pagination
            current={currentPage}
            total={totalResults}
            pageSize={ADMIN_INVITES_PAGE_SIZE}
            showSizeChanger={false}
            showLessItems
            onChange={onPageChange}
          />
        </nav>
      ) : null}
    </div>
  );
}
