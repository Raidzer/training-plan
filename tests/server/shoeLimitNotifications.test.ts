import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbSelectMock } = vi.hoisted(() => {
  return {
    dbSelectMock: vi.fn(),
  };
});

vi.mock("@/server/db/client", () => {
  return {
    db: {
      select: dbSelectMock,
    },
  };
});

import {
  resolveShoeLimitNotificationTargets,
  type ShoeLimitNotificationTarget,
} from "@/server/shoeLimitNotifications";
import type { WorkoutReportShoeLimitExceeded } from "@/server/workoutReports";

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
});
