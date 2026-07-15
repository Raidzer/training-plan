import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RegisterInviteNotice } from "@/app/register/RegisterClient/components/RegisterInviteNotice/RegisterInviteNotice";
import { REGISTER_TEXT } from "@/app/register/RegisterClient/constants/registerConstants";

describe("RegisterInviteNotice", () => {
  it("объясняет invite-only доступ и предлагает безопасную ссылку ко входу", () => {
    render(<RegisterInviteNotice />);

    const notice = screen.getByRole("region", { name: REGISTER_TEXT.inviteNoticeTitle });
    expect(within(notice).getByText(REGISTER_TEXT.inviteNotice)).toBeTruthy();
    expect(within(notice).getByText(REGISTER_TEXT.inviteHelp)).toBeTruthy();

    const backLink = within(notice).getByRole("link", { name: REGISTER_TEXT.backToLogin });
    expect(backLink.getAttribute("href")).toBe("/login");
    expect(backLink.querySelector("button")).toBeNull();
  });
});
