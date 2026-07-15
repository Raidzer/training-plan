import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CreatedInvitePanel } from "@/app/(protected)/admin/invites/AdminInvitesClient/components/CreatedInvitePanel/CreatedInvitePanel";
import { ADMIN_INVITES_LABELS } from "@/app/(protected)/admin/invites/AdminInvitesClient/constants/adminInvitesConstants";

describe("CreatedInvitePanel", () => {
  it("не занимает место до создания приглашения", () => {
    render(<CreatedInvitePanel inviteUrl="" onCopy={vi.fn()} />);

    expect(screen.queryByRole("status")).toBeNull();
  });

  it("показывает read-only ссылку и копирует точное значение", () => {
    const inviteUrl = "https://training.example/register?invite=runtime-token";
    const onCopy = vi.fn();
    render(<CreatedInvitePanel inviteUrl={inviteUrl} onCopy={onCopy} />);

    expect(screen.getByRole("status")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: ADMIN_INVITES_LABELS.linkCreatedTitle })
    ).toBeTruthy();
    const input = screen.getByRole("textbox", { name: ADMIN_INVITES_LABELS.createdLinkLabel });
    expect((input as HTMLInputElement).value).toBe(inviteUrl);
    expect((input as HTMLInputElement).readOnly).toBe(true);

    fireEvent.click(
      screen.getByRole("button", { name: ADMIN_INVITES_LABELS.copyCreatedInviteButton })
    );

    expect(onCopy).toHaveBeenCalledWith(inviteUrl);
  });
});
