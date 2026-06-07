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
    vi.unstubAllGlobals();
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

  it("показывает активный код из статуса и обрабатывает ошибку выдачи кода", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ...unlinkedStatus,
            codeExpiresAt: "2030-06-06T12:10:00.000Z",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "already-linked" }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<TelegramLinkPanel />);

    expect(await screen.findByText(/Последний код действует до/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Получить код" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/telegram/link-code", { method: "POST" });
    });

    expect(screen.queryByText("/link 123456")).toBeNull();
  });

  it("отвязывает Telegram и перезагружает статус", async () => {
    const linkedStatus = {
      linked: true,
      telegram: {
        username: null,
        firstName: "Runner",
        linkedAt: "2026-06-06T12:00:00.000Z",
      },
      subscription: {
        enabled: false,
        timezone: null,
        sendTime: null,
      },
      codeExpiresAt: null,
      codeConsumedAt: null,
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(linkedStatus), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
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

    expect(await screen.findByText("Telegram: Runner")).toBeTruthy();
    expect(
      screen.getByText("Рассылка выключена. Время: не задано. Таймзона: не задана.")
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Отвязать Telegram" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/telegram/unlink", { method: "POST" });
    });
    expect(await screen.findByText("Аккаунт не связан")).toBeTruthy();
  });

  it("показывает fallback при ошибке загрузки статуса", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    render(<TelegramLinkPanel />);

    expect(await screen.findByText("Аккаунт не связан")).toBeTruthy();
    expect(screen.getByText("После связки можно получать план и рассылку.")).toBeTruthy();

    consoleErrorSpy.mockRestore();
  });

  it("показывает fallback для связанного Telegram без имени и ошибку отвязки", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            linked: true,
            telegram: {
              username: null,
              firstName: null,
              linkedAt: null,
            },
            subscription: null,
            codeExpiresAt: null,
            codeConsumedAt: null,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 123 }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<TelegramLinkPanel />);

    expect(await screen.findByText("Telegram: Связан")).toBeTruthy();
    expect(screen.getByText("Рассылка не настроена")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Отвязать Telegram" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/telegram/unlink", { method: "POST" });
    });
    expect(screen.getByText("Telegram: Связан")).toBeTruthy();
  });

  it("показывает fallback текста кода при невалидной дате и generic issue error", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ...unlinkedStatus,
            codeExpiresAt: "bad-date",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response("", {
          status: 500,
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<TelegramLinkPanel />);

    expect(
      await screen.findByText("Код действует 15 минут. Новый код заменит старый.")
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Получить код" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/telegram/link-code", { method: "POST" });
    });
    expect(screen.queryByText("/link 999000")).toBeNull();
  });

  it("показывает н/д для выданного кода без корректной даты и обрабатывает сетевые ошибки", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(unlinkedStatus), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ code: "999000", expiresAt: "bad-date" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(unlinkedStatus), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockRejectedValueOnce(new Error("issue-network"));
    vi.stubGlobal("fetch", fetchMock);

    render(<TelegramLinkPanel />);

    expect(await screen.findByText("Аккаунт не связан")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Получить код" }));

    expect(await screen.findByText("/link 999000")).toBeTruthy();
    expect(screen.getByText("Код действует до н/д.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Получить код" }));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });
});
