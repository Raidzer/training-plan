"use client";

import { App } from "antd";
import { AdminInvitesFilters } from "./components/AdminInvitesFilters/AdminInvitesFilters";
import { AdminInvitesHeader } from "./components/AdminInvitesHeader/AdminInvitesHeader";
import { AdminInvitesList } from "./components/AdminInvitesList/AdminInvitesList";
import { AdminInvitesOverview } from "./components/AdminInvitesOverview/AdminInvitesOverview";
import { InviteCreatePanel } from "./components/InviteCreatePanel/InviteCreatePanel";
import { ADMIN_INVITES_LABELS } from "./constants/adminInvitesConstants";
import { useAdminInvites } from "./hooks/useAdminInvites";
import { useAdminInvitesDirectory } from "./hooks/useAdminInvitesDirectory";
import type { AdminInvitesClientProps } from "./types/adminInvitesTypes";
import styles from "./AdminInvitesClient.module.scss";

export function AdminInvitesClient({ invites }: AdminInvitesClientProps) {
  const { message: messageApi } = App.useApp();
  const { form, rows, creating, tokenById, lastInviteUrl, handleCopy, handleCreate } =
    useAdminInvites({
      invites,
      messageApi,
    });
  const {
    query,
    roleFilter,
    statusFilter,
    stats,
    visibleInvites,
    filteredInvitesCount,
    currentPage,
    hasActiveFilters,
    isSearchPending,
    updateQuery,
    updateRoleFilter,
    updateStatusFilter,
    updatePage,
    resetFilters,
  } = useAdminInvitesDirectory(rows);

  return (
    <div className={styles.page}>
      <AdminInvitesHeader />
      <AdminInvitesOverview stats={stats} />

      <div className={styles.workspace}>
        <InviteCreatePanel
          form={form}
          creating={creating}
          inviteUrl={lastInviteUrl}
          onSubmit={handleCreate}
          onCopy={handleCopy}
        />

        <section className={styles.registry} aria-labelledby="admin-invites-registry-title">
          <header className={styles.registryHeader}>
            <h2 id="admin-invites-registry-title" className={styles.registryTitle}>
              {ADMIN_INVITES_LABELS.registryTitle}
            </h2>
            <p className={styles.registrySubtitle}>{ADMIN_INVITES_LABELS.registrySubtitle}</p>
          </header>

          <AdminInvitesFilters
            query={query}
            roleFilter={roleFilter}
            statusFilter={statusFilter}
            resultsCount={filteredInvitesCount}
            hasActiveFilters={hasActiveFilters}
            isSearchPending={isSearchPending}
            onQueryChange={updateQuery}
            onRoleFilterChange={updateRoleFilter}
            onStatusFilterChange={updateStatusFilter}
            onReset={resetFilters}
          />
          <AdminInvitesList
            invites={visibleInvites}
            tokenById={tokenById}
            totalResults={filteredInvitesCount}
            currentPage={currentPage}
            hasActiveFilters={hasActiveFilters}
            onCopy={handleCopy}
            onPageChange={updatePage}
            onResetFilters={resetFilters}
          />
        </section>
      </div>
    </div>
  );
}
