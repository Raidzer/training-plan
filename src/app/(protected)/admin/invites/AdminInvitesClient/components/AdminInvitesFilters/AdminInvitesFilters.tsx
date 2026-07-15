"use client";

import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Input, Select } from "antd";
import type { ChangeEvent } from "react";
import {
  ADMIN_INVITES_LABELS,
  ROLE_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from "../../constants/adminInvitesConstants";
import type { InviteRoleFilter, InviteStatusFilter } from "../../types/adminInvitesTypes";
import { formatInvitesCount } from "../../utils/adminInvitesUtils";
import styles from "./AdminInvitesFilters.module.scss";

type AdminInvitesFiltersProps = {
  query: string;
  roleFilter: InviteRoleFilter;
  statusFilter: InviteStatusFilter;
  resultsCount: number;
  hasActiveFilters: boolean;
  isSearchPending: boolean;
  onQueryChange: (value: string) => void;
  onRoleFilterChange: (value: InviteRoleFilter) => void;
  onStatusFilterChange: (value: InviteStatusFilter) => void;
  onReset: () => void;
};

export function AdminInvitesFilters({
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
}: AdminInvitesFiltersProps) {
  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    onQueryChange(event.target.value);
  };

  return (
    <search className={styles.search} aria-label={ADMIN_INVITES_LABELS.resultsLabel}>
      <div className={styles.controls}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="admin-invites-search">
            {ADMIN_INVITES_LABELS.searchLabel}
          </label>
          <Input
            id="admin-invites-search"
            value={query}
            prefix={<SearchOutlined aria-hidden />}
            placeholder={ADMIN_INVITES_LABELS.searchPlaceholder}
            onChange={handleQueryChange}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="admin-invites-role-filter">
            {ADMIN_INVITES_LABELS.roleFilterLabel}
          </label>
          <Select<InviteRoleFilter>
            id="admin-invites-role-filter"
            value={roleFilter}
            options={ROLE_FILTER_OPTIONS}
            onChange={onRoleFilterChange}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="admin-invites-status-filter">
            {ADMIN_INVITES_LABELS.statusFilterLabel}
          </label>
          <Select<InviteStatusFilter>
            id="admin-invites-status-filter"
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
          {ADMIN_INVITES_LABELS.resetFiltersButton}
        </Button>
      </div>

      <p
        className={styles.results}
        aria-live="polite"
        aria-atomic="true"
        aria-busy={isSearchPending}
      >
        {formatInvitesCount(resultsCount)}
      </p>
    </search>
  );
}
