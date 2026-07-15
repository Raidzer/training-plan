"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { ADMIN_USERS_PAGE_SIZE } from "../constants/adminUsersConstants";
import type {
  AdminUserRoleFilter,
  AdminUserRow,
  AdminUserStatusFilter,
} from "../types/adminUsersTypes";
import { filterAdminUsers, getAdminUsersStats } from "../utils/adminUsersUtils";

export function useAdminUsersDirectory(users: AdminUserRow[]) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilterState] = useState<AdminUserRoleFilter>("all");
  const [statusFilter, setStatusFilterState] = useState<AdminUserStatusFilter>("all");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query);

  const stats = useMemo(() => getAdminUsersStats(users), [users]);
  const filteredUsers = useMemo(
    () => filterAdminUsers(users, deferredQuery, roleFilter, statusFilter),
    [deferredQuery, roleFilter, statusFilter, users]
  );
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ADMIN_USERS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ADMIN_USERS_PAGE_SIZE;
    return filteredUsers.slice(startIndex, startIndex + ADMIN_USERS_PAGE_SIZE);
  }, [currentPage, filteredUsers]);
  const hasActiveFilters = query.length > 0 || roleFilter !== "all" || statusFilter !== "all";

  const updateQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const updateRoleFilter = (value: AdminUserRoleFilter) => {
    setRoleFilterState(value);
    setPage(1);
  };

  const updateStatusFilter = (value: AdminUserStatusFilter) => {
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
    visibleUsers,
    filteredUsersCount: filteredUsers.length,
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
