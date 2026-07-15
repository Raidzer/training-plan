import type { InviteFormValues } from "../types/adminInvitesTypes";

export class AdminInvitesApiError extends Error {
  readonly responseData: unknown;

  constructor(responseData: unknown) {
    super("Admin invites API request failed");
    this.name = "AdminInvitesApiError";
    this.responseData = responseData;
  }
}

export async function createAdminInvite(values: InviteFormValues) {
  const response = await fetch("/api/admin/invites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new AdminInvitesApiError(data);
  }

  return data;
}
