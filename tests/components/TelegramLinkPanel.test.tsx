import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TelegramLinkPanel } from "@/components/TelegramLinkPanel/TelegramLinkPanel";

const unlinkedStatus = {
  linked: false,
  telegram: null,
  subscription: null,
  codeExpiresAt: null,
  codeConsumedAt: null,
};

describe("TelegramLinkPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("показывает несвязанный Telegram и получает код", async () => {
    const expiresAt = "2026-06-06T12:15:00.000Z";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(unlinkedStatus), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ code: "123456", expiresAt }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(unlinkedStatus), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<TelegramLinkPanel />);

    expect(await screen.findByText("Аккаунт не связан")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Получить код" }));

    expect(await screen.findByText("/link 123456")).toBeTruthy();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/telegram/link-code", { method: "POST" });
    });
  });

  it("показывает связанный Telegram", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            linked: true,
            telegram: {
              username: "runner",
              firstName: "Runner",
              linkedAt: "2026-06-06T12:00:00.000Z",
            },
            subscription: {
              enabled: true,
              timezone: "Europe/Moscow",
              sendTime: "08:00",
            },
            codeExpiresAt: null,
            codeConsumedAt: null,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
    );

    render(<TelegramLinkPanel />);

    expect(await screen.findByText("Аккаунт связан")).toBeTruthy();
    expect(screen.getByText("Telegram: @runner")).toBeTruthy();
    expect(
      screen.getByText("Рассылка включена. Время: 08:00. Таймзона: Europe/Moscow.")
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Отвязать Telegram" })).toBeTruthy();
  });
});
