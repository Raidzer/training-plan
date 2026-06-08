import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { dbSelectMock, sendShoeLimitEmailMock } = vi.hoisted(() => {
  return {
    dbSelectMock: vi.fn(),
    sendShoeLimitEmailMock: vi.fn(),
  };
});

vi.mock("@/server/db/client", () => {
  return {
    db: {
      select: dbSelectMock,
    },
  };
});

vi.mock("@/server/email", () => {
  return {
    sendShoeLimitEmail: sendShoeLimitEmailMock,
  };
});

import {
  resolveShoeLimitNotificationTargets,
  sendShoeLimitNotifications,
  type ShoeLimitNotificationTarget,
} from "@/server/shoeLimitNotifications";
import type { WorkoutReportShoeLimitExceeded } from "@/server/workoutReports";

const originalTelegramBotToken = process.env.TELEGRAM_BOT_TOKEN;

function createSelectBuilder(rows: unknown[]) {
  const limitMock = vi.fn().mockResolvedValue(rows);
  const whereMock = vi.fn(() => {
    return {
      limit: limitMock,
    };
  });
  const fromMock = vi.fn(() => {
    return {
      where: whereMock,
    };
  });

  return {
    from: fromMock,
  };
}

function createShoe(
  overrides: Partial<WorkoutReportShoeLimitExceeded> = {}
): WorkoutReportShoeLimitExceeded {
  return {
    id: 1,
    name: "Pegasus",
    mileageLimitKm: "800",
    currentMileageKm: "801",
    notifyOnLimitEmail: true,
    notifyOnLimitTelegram: true,
    ...overrides,
  };
}

describe("resolveShoeLimitNotificationTargets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TELEGRAM_BOT_TOKEN = "test-token";
    sendShoeLimitEmailMock.mockResolvedValue(undefined);
    global.fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 })) as typeof fetch;
  });

  afterEach(() => {
    if (originalTelegramBotToken === undefined) {
      delete process.env.TELEGRAM_BOT_TOKEN;
    } else {
      process.env.TELEGRAM_BOT_TOKEN = originalTelegramBotToken;
    }
  });

  it("не запрашивает контакты, если нет обуви с превышенным лимитом", async () => {
    const result = await resolveShoeLimitNotificationTargets({
      userId: 1,
      shoes: [],
    });

    expect(result).toEqual([]);
    expect(dbSelectMock).not.toHaveBeenCalled();
  });

  it("возвращает только актуально доступные каналы", async () => {
    const emailShoe = createShoe({
      id: 1,
      notifyOnLimitEmail: true,
      notifyOnLimitTelegram: false,
    });
    const telegramShoe = createShoe({
      id: 2,
      notifyOnLimitEmail: false,
      notifyOnLimitTelegram: true,
    });
    const bothChannelsShoe = createShoe({
      id: 3,
      notifyOnLimitEmail: true,
      notifyOnLimitTelegram: true,
    });

    dbSelectMock
      .mockReturnValueOnce(
        createSelectBuilder([
          {
            email: "runner@example.com",
            emailVerified: new Date("2026-01-01T00:00:00.000Z"),
          },
        ])
      )
      .mockReturnValueOnce(createSelectBuilder([{ chatId: 123456 }]));

    const result = await resolveShoeLimitNotificationTargets({
      userId: 7,
      shoes: [emailShoe, telegramShoe, bothChannelsShoe],
    });

    expect(result).toEqual<ShoeLimitNotificationTarget[]>([
      {
        shoe: emailShoe,
        email: "runner@example.com",
        telegramChatId: null,
      },
      {
        shoe: telegramShoe,
        email: null,
        telegramChatId: 123456,
      },
      {
        shoe: bothChannelsShoe,
        email: "runner@example.com",
        telegramChatId: 123456,
      },
    ]);
  });

  it("не возвращает каналы, если почта не подтверждена и Telegram отвязан", async () => {
    dbSelectMock
      .mockReturnValueOnce(
        createSelectBuilder([
          {
            email: "runner@example.com",
            emailVerified: null,
          },
        ])
      )
      .mockReturnValueOnce(createSelectBuilder([]));

    const result = await resolveShoeLimitNotificationTargets({
      userId: 7,
      shoes: [createShoe()],
    });

    expect(result).toEqual([]);
  });

  it("не возвращает каналы, если пользователь не найден", async () => {
    dbSelectMock.mockReturnValueOnce(createSelectBuilder([]));

    const result = await resolveShoeLimitNotificationTargets({
      userId: 7,
      shoes: [createShoe()],
    });

    expect(result).toEqual([]);
  });

  it("отправляет уведомления по всем доступным каналам", async () => {
    const shoe = createShoe();
    dbSelectMock
      .mockReturnValueOnce(
        createSelectBuilder([
          {
            email: "runner@example.com",
            emailVerified: new Date("2026-01-01T00:00:00.000Z"),
          },
        ])
      )
      .mockReturnValueOnce(createSelectBuilder([{ chatId: 123456 }]));

    const result = await sendShoeLimitNotifications({
      userId: 7,
      shoes: [shoe],
    });

    expect(sendShoeLimitEmailMock).toHaveBeenCalledWith({
      email: "runner@example.com",
      shoeName: "Pegasus",
      currentMileageKm: "801",
      mileageLimitKm: "800",
    });
    const fetchMock = vi.mocked(global.fetch);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/sendMessage");
    const requestBody = JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body));
    expect(requestBody.chat_id).toBe(123456);
    expect(requestBody.text).toContain("Pegasus");
    expect(result).toEqual({
      targets: 1,
      sent: 2,
      failed: 0,
    });
  });

  it("считает неуспешные отправки, но не прерывает остальные каналы", async () => {
    sendShoeLimitEmailMock.mockRejectedValueOnce(new Error("mail-failed"));
    global.fetch = vi
      .fn()
      .mockResolvedValue(new Response("telegram-failed", { status: 500 })) as typeof fetch;
    dbSelectMock
      .mockReturnValueOnce(
        createSelectBuilder([
          {
            email: "runner@example.com",
            emailVerified: new Date("2026-01-01T00:00:00.000Z"),
          },
        ])
      )
      .mockReturnValueOnce(createSelectBuilder([{ chatId: 123456 }]));

    const result = await sendShoeLimitNotifications({
      userId: 7,
      shoes: [createShoe()],
    });

    expect(result).toEqual({
      targets: 1,
      sent: 0,
      failed: 2,
    });
  });
});
