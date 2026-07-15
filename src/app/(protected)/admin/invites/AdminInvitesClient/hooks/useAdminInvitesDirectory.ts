"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { ADMIN_INVITES_PAGE_SIZE } from "../constants/adminInvitesConstants";
import type {
  AdminInviteRow,
  InviteRoleFilter,
  InviteStatusFilter,
} from "../types/adminInvitesTypes";
import { filterAdminInvites, getAdminInvitesStats } from "../utils/adminInvitesUtils";

export function useAdminInvitesDirectory(invites: AdminInviteRow[]) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilterState] = useState<InviteRoleFilter>("all");
  const [statusFilter, setStatusFilterState] = useState<InviteStatusFilter>("all");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query);

  const stats = useMemo(() => getAdminInvitesStats(invites), [invites]);
  const filteredInvites = useMemo(
    () => filterAdminInvites(invites, deferredQuery, roleFilter, statusFilter),
    [deferredQuery, invites, roleFilter, statusFilter]
  );
  const totalPages = Math.max(1, Math.ceil(filteredInvites.length / ADMIN_INVITES_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleInvites = useMemo(() => {
    const startIndex = (currentPage - 1) * ADMIN_INVITES_PAGE_SIZE;
    return filteredInvites.slice(startIndex, startIndex + ADMIN_INVITES_PAGE_SIZE);
  }, [currentPage, filteredInvites]);
  const hasActiveFilters = query.length > 0 || roleFilter !== "all" || statusFilter !== "all";

  const updateQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const updateRoleFilter = (value: InviteRoleFilter) => {
    setRoleFilterState(value);
    setPage(1);
  };

  const updateStatusFilter = (value: InviteStatusFilter) => {
    setStatusFilterState(value);
    setPage(1);
  };

  const resetFilters = () => {
    setQuery("");
    setRoleFilterState("all");
    setStatusFilterState("all");
    setPage(1);
  };

  return {
    query,
    roleFilter,
    statusFilter,
    stats,
    visibleInvites,
    filteredInvitesCount: filteredInvites.length,
    currentPage,
    hasActiveFilters,
    isSearchPending: query !== deferredQuery,
    updateQuery,
    updateRoleFilter,
    updateStatusFilter,
    updatePage: setPage,
    resetFilters,
  };
}
