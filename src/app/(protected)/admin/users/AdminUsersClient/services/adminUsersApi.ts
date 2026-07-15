import type { AdminUserRow, RoleFormValues } from "../types/adminUsersTypes";

export class AdminUsersApiError extends Error {
  readonly responseData: unknown;

  constructor(responseData: unknown) {
    super("Admin users API request failed");
    this.name = "AdminUsersApiError";
    this.responseData = responseData;
  }
}

async function requestAdminUsersApi(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new AdminUsersApiError(data);
  }

  return data;
}

export async function updateAdminUserRole(userId: number, role: RoleFormValues["role"]) {
  await requestAdminUsersApi(`/api/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
}

export async function updateAdminUserPassword(userId: number, password: string) {
  await requestAdminUsersApi(`/api/admin/users/${userId}/password`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
}

export async function updateAdminUserStatus(userId: number, isActive: boolean) {
  await requestAdminUsersApi(`/api/admin/users/${userId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive }),
  });
}

export async function deleteAdminUser(userId: AdminUserRow["id"]) {
  await requestAdminUsersApi(`/api/admin/users/${userId}`, {
    method: "DELETE",
  });
}

export async function clearAdminUserTrainingData(userId: AdminUserRow["id"]) {
  await requestAdminUsersApi(`/api/admin/users/${userId}/training-data`, {
    method: "DELETE",
  });
}
