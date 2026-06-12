import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbSelectMock, dbTransactionMock } = vi.hoisted(() => {
  return {
    dbSelectMock: vi.fn(),
    dbTransactionMock: vi.fn(),
  };
});

vi.mock("@/server/db/client", () => {
  return {
    db: {
      select: dbSelectMock,
      transaction: dbTransactionMock,
    },
  };
});

import {
  getLatestTelegramLinkCodeSummary,
  getTelegramAccountIdByUserId,
  getTelegramAccountSummary,
  getTelegramSubscriptionSummary,
  unlinkTelegramAccount,
  updateTelegramSubscriptionSettings,
} from "@/server/telegram";

function mockSelectWhereResult(rows: unknown[]) {
  const whereMock = vi.fn().mockResolvedValue(rows);
  const fromMock = vi.fn(() => {
    return {
      where: whereMock,
      innerJoin: vi.fn(() => ({
        where: whereMock,
      })),
    };
  });
  dbSelectMock.mockReturnValue({
    from: fromMock,
  });
}

function createTxSelectBuilder(rows: unknown[]) {
  return {
    from: vi.fn(() => ({
      where: vi.fn().mockResolvedValue(rows),
    })),
  };
}

describe("server/telegram", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getTelegramAccountIdByUserId должен возвращать id или null", async () => {
    mockSelectWhereResult([{ id: 7 }]);
    const present = await getTelegramAccountIdByUserId(1);
    expect(present).toBe(7);

    mockSelectWhereResult([]);
    const missing = await getTelegramAccountIdByUserId(1);
    expect(missing).toBeNull();
  });

  it("getTelegramAccountSummary должен возвращать аккаунт поля или null", async () => {
    const linkedAt = new Date("2026-02-09T10:00:00.000Z");
    mockSelectWhereResult([{ username: "runner", firstName: "Ivan", linkedAt }]);
    const present = await getTelegramAccountSummary(2);
    expect(present).toEqual({
      username: "runner",
      firstName: "Ivan",
      linkedAt,
    });

    mockSelectWhereResult([]);
    const missing = await getTelegramAccountSummary(2);
    expect(missing).toBeNull();
  });

  it("getTelegramSubscriptionSummary должен возвращать подписки поля или null", async () => {
    mockSelectWhereResult([{ enabled: true, timezone: "Europe/Moscow", sendTime: "08:00" }]);
    const present = await getTelegramSubscriptionSummary(3);
    expect(present).toEqual({
      enabled: true,
      timezone: "Europe/Moscow",
      sendTime: "08:00",
    });

    mockSelectWhereResult([]);
    const missing = await getTelegramSubscriptionSummary(3);
    expect(missing).toBeNull();
  });

  it("getLatestTelegramLinkCodeSummary должен возвращать последняя строка или null", async () => {
    const expiresAt = new Date("2026-02-09T11:00:00.000Z");
    const limitPresentMock = vi.fn().mockResolvedValue([{ expiresAt, consumedAt: null }]);
    dbSelectMock.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: limitPresentMock,
          })),
        })),
      })),
    });
    const present = await getLatestTelegramLinkCodeSummary(4);
    expect(present).toEqual({ expiresAt, consumedAt: null });

    const limitEmptyMock = vi.fn().mockResolvedValue([]);
    dbSelectMock.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: limitEmptyMock,
          })),
        })),
      })),
    });
    const missing = await getLatestTelegramLinkCodeSummary(4);
    expect(missing).toBeNull();
  });

  it("unlinkTelegramAccount должен возвращать deletion counters", async () => {
    const deleteMock = vi
      .fn()
      .mockImplementationOnce(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([{ id: 1 }]),
        })),
      }))
      .mockImplementationOnce(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([{ id: 2 }, { id: 3 }]),
        })),
      }))
      .mockImplementationOnce(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([]),
        })),
      }));

    dbTransactionMock.mockImplementation(async (callback: (tx: any) => unknown) => {
      return await callback({
        delete: deleteMock,
      });
    });

    const result = await unlinkTelegramAccount(9);

    expect(result).toEqual({
      accounts: 1,
      subscriptions: 2,
      codes: 0,
    });
  });

  it("updateTelegramSubscriptionSettings должен обновлять существующую подписку", async () => {
    const updateWhereMock = vi.fn().mockResolvedValue(undefined);
    const updateSetMock = vi.fn(() => ({
      where: updateWhereMock,
    }));
    const tx = {
      select: vi
        .fn()
        .mockReturnValueOnce(createTxSelectBuilder([{ chatId: 10 }]))
        .mockReturnValueOnce(createTxSelectBuilder([{ id: 5 }])),
      update: vi.fn(() => ({
        set: updateSetMock,
      })),
    };

    dbTransactionMock.mockImplementation(async (callback: (tx: any) => unknown) => {
      return await callback(tx);
    });
    mockSelectWhereResult([{ enabled: true, timezone: "Europe/Moscow", sendTime: "07:30" }]);

    const result = await updateTelegramSubscriptionSettings(20, {
      enabled: true,
      sendTime: "07:30",
    });

    expect(result).toEqual({
      enabled: true,
      timezone: "Europe/Moscow",
      sendTime: "07:30",
    });
    expect(updateSetMock).toHaveBeenCalledWith({
      enabled: true,
      sendTime: "07:30",
      updatedAt: expect.any(Date),
    });
  });

  it("updateTelegramSubscriptionSettings должен создавать подписку для связанного аккаунта", async () => {
    const insertValuesMock = vi.fn().mockResolvedValue(undefined);
    const tx = {
      select: vi
        .fn()
        .mockReturnValueOnce(createTxSelectBuilder([{ chatId: 10 }]))
        .mockReturnValueOnce(createTxSelectBuilder([])),
      insert: vi.fn(() => ({
        values: insertValuesMock,
      })),
    };

    dbTransactionMock.mockImplementation(async (callback: (tx: any) => unknown) => {
      return await callback(tx);
    });
    mockSelectWhereResult([{ enabled: false, timezone: "Europe/Moscow", sendTime: null }]);

    const result = await updateTelegramSubscriptionSettings(20, {
      enabled: false,
      sendTime: null,
    });

    expect(result).toEqual({
      enabled: false,
      timezone: "Europe/Moscow",
      sendTime: null,
    });
    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 20,
        chatId: 10,
        enabled: false,
        sendTime: null,
      })
    );
  });

  it("updateTelegramSubscriptionSettings должен возвращать null без связанного аккаунта", async () => {
    const tx = {
      select: vi.fn().mockReturnValueOnce(createTxSelectBuilder([])),
      update: vi.fn(),
      insert: vi.fn(),
    };

    dbTransactionMock.mockImplementation(async (callback: (tx: any) => unknown) => {
      return await callback(tx);
    });

    const result = await updateTelegramSubscriptionSettings(20, {
      enabled: true,
      sendTime: "07:30",
    });

    expect(result).toBeNull();
    expect(tx.update).not.toHaveBeenCalled();
    expect(tx.insert).not.toHaveBeenCalled();
    expect(dbSelectMock).toHaveBeenCalledTimes(0);
  });
});
