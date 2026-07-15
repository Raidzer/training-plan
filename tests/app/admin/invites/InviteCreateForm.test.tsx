import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Form } from "antd";
import { describe, expect, it, vi } from "vitest";

import { InviteCreateForm } from "@/app/(protected)/admin/invites/AdminInvitesClient/components/InviteCreateForm/InviteCreateForm";
import { ADMIN_INVITES_LABELS } from "@/app/(protected)/admin/invites/AdminInvitesClient/constants/adminInvitesConstants";
import type { InviteFormValues } from "@/app/(protected)/admin/invites/AdminInvitesClient/types/adminInvitesTypes";

type InviteCreateFormHarnessProps = {
  creating?: boolean;
  onSubmit: (values: InviteFormValues) => void;
};

function InviteCreateFormHarness({ creating = false, onSubmit }: InviteCreateFormHarnessProps) {
  const [form] = Form.useForm<InviteFormValues>();

  return <InviteCreateForm form={form} creating={creating} onSubmit={onSubmit} />;
}

describe("InviteCreateForm", () => {
  it("показывает обе роли и отправляет выбранную роль", async () => {
    const onSubmit = vi.fn();
    render(<InviteCreateFormHarness onSubmit={onSubmit} />);

    expect(screen.getByText(ADMIN_INVITES_LABELS.roleLabel)).toBeTruthy();
    expect(screen.getByText(ADMIN_INVITES_LABELS.roleHint)).toBeTruthy();
    expect(screen.getByRole("radiogroup", { name: ADMIN_INVITES_LABELS.roleLabel })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Атлет" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Тренер" })).toBeTruthy();

    fireEvent.click(screen.getByRole("radio", { name: "Тренер" }));
    fireEvent.click(screen.getByRole("button", { name: ADMIN_INVITES_LABELS.createButton }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ role: "coach" });
    });
  });

  it("не отправляет форму без роли и показывает ошибку валидации", async () => {
    const onSubmit = vi.fn();
    render(<InviteCreateFormHarness onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: ADMIN_INVITES_LABELS.createButton }));

    expect(await screen.findByText(ADMIN_INVITES_LABELS.selectRole)).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("блокирует повторную отправку во время создания", () => {
    render(<InviteCreateFormHarness creating onSubmit={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /Создать приглашение/ }).hasAttribute("disabled")
    ).toBe(true);
  });
});
