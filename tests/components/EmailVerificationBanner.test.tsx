import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";

const { useSessionMock } = vi.hoisted(() => ({
  useSessionMock: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  useSession: useSessionMock,
}));

const updateMock = vi.fn();

function mockSession(emailVerified: Date | null) {
  useSessionMock.mockReturnValue({
    data: {
      user: {
        emailVerified,
      },
    },
    update: updateMock,
  });
}

describe("EmailVerificationBanner", () => {
  beforeEach(() => {
    localStorage.clear();
    mockSession(null);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
  });

  it("показывает предупреждение для неподтвержденной почты", () => {
    localStorage.setItem("hide_verification_banner", "true");

    render(<EmailVerificationBanner />);

    expect(screen.getByText("Ваш Email не подтвержден")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Отправить письмо повторно" })).toBeTruthy();
  });

  it("не показывает предупреждение для подтвержденной почты", () => {
    mockSession(new Date("2026-01-01T00:00:00.000Z"));

    render(<EmailVerificationBanner />);

    expect(screen.queryByText("Ваш Email не подтвержден")).toBeNull();
  });

  it("отправляет запрос повторной отправки письма", async () => {
    render(<EmailVerificationBanner />);

    fireEvent.click(screen.getByRole("button", { name: "Отправить письмо повторно" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/auth/resend-verification", {
        method: "POST",
      });
    });
  });
});
