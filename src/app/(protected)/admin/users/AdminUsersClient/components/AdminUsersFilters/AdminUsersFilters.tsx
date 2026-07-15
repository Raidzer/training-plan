"use client";

import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Input, Select } from "antd";
import type { ChangeEvent } from "react";
import {
  ADMIN_USERS_LABELS,
  ROLE_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from "../../constants/adminUsersConstants";
import type { AdminUserRoleFilter, AdminUserStatusFilter } from "../../types/adminUsersTypes";
import { formatUsersCount } from "../../utils/adminUsersUtils";
import styles from "./AdminUsersFilters.module.scss";

type AdminUsersFiltersProps = {
  query: string;
  roleFilter: AdminUserRoleFilter;
  statusFilter: AdminUserStatusFilter;
  resultsCount: number;
  hasActiveFilters: boolean;
  isSearchPending: boolean;
  onQueryChange: (value: string) => void;
  onRoleFilterChange: (value: AdminUserRoleFilter) => void;
  onStatusFilterChange: (value: AdminUserStatusFilter) => void;
  onReset: () => void;
};

export function AdminUsersFilters({
  query,
  roleFilter,
  statusFilter,
  resultsCount,
  hasActiveFilters,
  isSearchPending,
  onQueryChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onReset,
}: AdminUsersFiltersProps) {
  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    onQueryChange(event.target.value);
  };

  return (
    <search className={styles.search} aria-label={ADMIN_USERS_LABELS.resultsLabel}>
      <div className={styles.controls}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="admin-users-search">
            {ADMIN_USERS_LABELS.searchLabel}
          </label>
          <Input
            id="admin-users-search"
            value={query}
            prefix={<SearchOutlined aria-hidden />}
            placeholder={ADMIN_USERS_LABELS.searchPlaceholder}
            allowClear
            onChange={handleQueryChange}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="admin-users-role-filter">
            {ADMIN_USERS_LABELS.roleFilterLabel}
          </label>
          <Select<AdminUserRoleFilter>
            id="admin-users-role-filter"
            value={roleFilter}
            options={ROLE_FILTER_OPTIONS}
            onChange={onRoleFilterChange}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="admin-users-status-filter">
            {ADMIN_USERS_LABELS.statusFilterLabel}
          </label>
          <Select<AdminUserStatusFilter>
            id="admin-users-status-filter"
            value={statusFilter}
            options={STATUS_FILTER_OPTIONS}
            onChange={onStatusFilterChange}
          />
        </div>

        <Button
          className={styles.resetButton}
          icon={<ReloadOutlined aria-hidden />}
          disabled={!hasActiveFilters}
          onClick={onReset}
        >
          {ADMIN_USERS_LABELS.resetFiltersButton}
        </Button>
      </div>

      <p
        className={styles.results}
        aria-live="polite"
        aria-atomic="true"
        aria-busy={isSearchPending}
      >
        {formatUsersCount(resultsCount)}
      </p>
    </search>
  );
}
