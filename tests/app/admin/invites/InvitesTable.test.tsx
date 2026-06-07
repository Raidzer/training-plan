import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ADMIN_INVITES_LABELS } from "@/app/admin/invites/AdminInvitesClient/constants/adminInvitesConstants";
import { InvitesTable } from "@/app/admin/invites/AdminInvitesClient/components/InvitesTable/InvitesTable";
import type { AdminInviteRow } from "@/app/admin/invites/AdminInvitesClient/types/adminInvitesTypes";

function createInvite(overrides: Partial<AdminInviteRow> = {}): AdminInviteRow {
  return {
    id: 1,
    role: "athlete",
    createdAt: "2026-01-01T00:00:00.000Z",
    expiresAt: "2026-01-02T00:00:00.000Z",
    usedAt: null,
    status: "active",
    createdBy: {
      id: 10,
      name: "Админ",
      email: "admin@example.com",
    },
    usedBy: null,
    ...overrides,
  };
}

describe("InvitesTable", () => {
  it("должен показывать приглашения и копировать доступную ссылку", () => {
    const onCopy = vi.fn();
    const activeInvite = createInvite();
    const usedInvite = createInvite({
      id: 2,
      role: "coach",
      status: "used",
      usedAt: "2026-01-01T12:00:00.000Z",
      usedBy: {
        id: 20,
        name: "",
        email: "used@example.com",
      },
    });
    const expiredInvite = createInvite({
      id: 3,
      role: "custom",
      status: "expired",
      createdBy: null,
    });

    render(
      <InvitesTable
        rows={[activeInvite, usedInvite, expiredInvite]}
        tokenById={{ 1: "token-1" }}
        onCopy={onCopy}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Копировать/ }));

    expect(onCopy).toHaveBeenCalledWith(expect.stringContaining("token-1"));
    expect(screen.getByText("Активна")).toBeTruthy();
    expect(screen.getByText("Использована")).toBeTruthy();
    expect(screen.getByText("Истекла")).toBeTruthy();
    expect(screen.getByText("Атлет")).toBeTruthy();
    expect(screen.getByText("Тренер")).toBeTruthy();
    expect(screen.getByText("custom")).toBeTruthy();
    expect(screen.getAllByText(ADMIN_INVITES_LABELS.unavailableLink)).toHaveLength(2);
    expect(screen.getAllByText("Админ").length).toBeGreaterThan(0);
  });
});
