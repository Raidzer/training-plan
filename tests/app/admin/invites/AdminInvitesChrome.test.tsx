import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminInvitesHeader } from "@/app/(protected)/admin/invites/AdminInvitesClient/components/AdminInvitesHeader/AdminInvitesHeader";
import { AdminInvitesOverview } from "@/app/(protected)/admin/invites/AdminInvitesClient/components/AdminInvitesOverview/AdminInvitesOverview";
import { ADMIN_INVITES_LABELS } from "@/app/(protected)/admin/invites/AdminInvitesClient/constants/adminInvitesConstants";

describe("AdminInvites page chrome", () => {
  it("показывает заголовок и прямые ссылки на пользователей и главное меню", () => {
    render(<AdminInvitesHeader />);

    expect(
      screen.getByRole("heading", { level: 1, name: ADMIN_INVITES_LABELS.title })
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: ADMIN_INVITES_LABELS.usersButton }).getAttribute("href")
    ).toBe("/admin/users");
    expect(
      screen.getByRole("link", { name: ADMIN_INVITES_LABELS.dashboardButton }).getAttribute("href")
    ).toBe("/dashboard");
  });

  it("показывает все четыре значения сводки", () => {
    render(
      <AdminInvitesOverview
        stats={{
          total: 17,
          active: 5,
          used: 8,
          expired: 4,
        }}
      />
    );

    const overview = screen.getByRole("region", { name: ADMIN_INVITES_LABELS.overviewLabel });
    expect(overview.textContent).toContain(`${ADMIN_INVITES_LABELS.totalInvitesMetric}17`);
    expect(overview.textContent).toContain(`${ADMIN_INVITES_LABELS.activeInvitesMetric}5`);
    expect(overview.textContent).toContain(`${ADMIN_INVITES_LABELS.usedInvitesMetric}8`);
    expect(overview.textContent).toContain(`${ADMIN_INVITES_LABELS.expiredInvitesMetric}4`);
  });
});
