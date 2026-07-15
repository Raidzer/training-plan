import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TelegramLinkPanel } from "@/components/TelegramLinkPanel/TelegramLinkPanel";

const unlinkedStatus = {
  linked: false,
  botUrl: "https://t.me/RunLogBot",
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
        new Response(
          JSON.stringify({
            code: "123456",
            linkUrl: "https://t.me/RunLogBot?start=deep-link-token",
            expiresAt,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
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
    const botLink = screen.getByRole("link", { name: "Перейти в Telegram-бота" });
    expect(botLink.getAttribute("href")).toBe("https://t.me/RunLogBot");
    fireEvent.click(screen.getByRole("button", { name: "Получить ссылку" }));

    const telegramLink = await screen.findByRole("link", { name: "Открыть Telegram" });
    expect(telegramLink.getAttribute("href")).toBe("https://t.me/RunLogBot?start=deep-link-token");
    expect(await screen.findByText("123456")).toBeTruthy();
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
            botUrl: "https://t.me/RunLogBot",
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
    expect(screen.getByRole("switch", { name: "Подписка на рассылку" })).toBeTruthy();
    expect(screen.getByLabelText("Время рассылки")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Сохранить настройки рассылки" })).toBeTruthy();
    const botLink = screen.getByRole("link", { name: "Перейти в Telegram-бота" });
    expect(botLink.getAttribute("href")).toBe("https://t.me/RunLogBot");
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

    expect(await screen.findByText(/Последняя ссылка действует до/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Получить ссылку" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/telegram/link-code", { method: "POST" });
    });

    expect(screen.queryByText("123456")).toBeNull();
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
    const botLink = screen.getByRole("link", { name: "Перейти в Telegram-бота" });
    expect(botLink.getAttribute("href")).toBe("https://t.me/RunLogBot");
  });

  it("показывает fallback при ошибке загрузки статуса", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify(unlinkedStatus), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<TelegramLinkPanel />);

    expect(await screen.findByText("Не удалось загрузить статус Telegram")).toBeTruthy();
    expect(screen.queryByText("Аккаунт не связан")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));

    expect(await screen.findByText("Аккаунт не связан")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    consoleErrorSpy.mockRestore();
  });

  it("скрывает собственный заголовок во встроенном режиме", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(unlinkedStatus), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    const { rerender } = render(<TelegramLinkPanel />);

    expect(await screen.findByRole("heading", { level: 4, name: "Telegram" })).toBeTruthy();

    rerender(<TelegramLinkPanel showHeader={false} />);

    expect(screen.queryByRole("heading", { level: 4, name: "Telegram" })).toBeNull();
    expect(screen.getByText("Аккаунт не связан")).toBeTruthy();
  });

  it("показывает fallback для связанного Telegram без имени и ошибку отвязки", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            linked: true,
            botUrl: "https://t.me/RunLogBot",
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
      await screen.findByText("Ссылка и код действуют 15 минут. Новая выдача заменит старую.")
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Получить ссылку" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/telegram/link-code", { method: "POST" });
    });
    expect(screen.queryByText("999000")).toBeNull();
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
        new Response(JSON.stringify({ code: "999000", linkUrl: null, expiresAt: "bad-date" }), {
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
    const botLink = screen.getByRole("link", { name: "Перейти в Telegram-бота" });
    expect(botLink.getAttribute("href")).toBe("https://t.me/RunLogBot");
    fireEvent.click(screen.getByRole("button", { name: "Получить ссылку" }));

    expect(await screen.findByText("999000")).toBeTruthy();
    expect(screen.getByText("Код действует до н/д.")).toBeTruthy();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
    await waitFor(() => {
      const issueButton = screen.getByRole("button", {
        name: "Получить ссылку",
      }) as HTMLButtonElement;
      expect(issueButton.disabled).toBe(false);
    });

    fireEvent.click(screen.getByRole("button", { name: "Получить ссылку" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(4);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it("сохраняет настройки Telegram-рассылки в профиле", async () => {
    const linkedStatus = {
      linked: true,
      telegram: {
        username: "runner",
        firstName: "Runner",
        linkedAt: "2026-06-06T12:00:00.000Z",
      },
      subscription: {
        enabled: false,
        timezone: "Europe/Moscow",
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
        new Response(
          JSON.stringify({
            success: true,
            subscription: {
              enabled: true,
              timezone: "Europe/Moscow",
              sendTime: "08:30",
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<TelegramLinkPanel />);

    expect(await screen.findByText("Telegram: @runner")).toBeTruthy();
    fireEvent.click(screen.getByRole("switch", { name: "Подписка на рассылку" }));
    fireEvent.change(screen.getByLabelText("Время рассылки"), {
      target: { value: "08:30" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить настройки рассылки" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/telegram/subscription", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: true,
          sendTime: "08:30",
        }),
      });
    });
    expect(
      await screen.findByText("Рассылка включена. Время: 08:30. Таймзона: Europe/Moscow.")
    ).toBeTruthy();
  });
});
