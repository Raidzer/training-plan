import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RegisterLoadingState } from "@/app/register/RegisterClient/components/RegisterLoadingState/RegisterLoadingState";
import { REGISTER_TEXT } from "@/app/register/RegisterClient/constants/registerConstants";

describe("RegisterLoadingState", () => {
  it("показывает осмысленный и доступный fallback", () => {
    render(<RegisterLoadingState />);

    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-busy")).toBe("true");
    expect(
      screen.getByRole("heading", { level: 1, name: REGISTER_TEXT.loadingTitle })
    ).toBeTruthy();
    expect(screen.getByText(REGISTER_TEXT.loadingDescription)).toBeTruthy();
  });
});
