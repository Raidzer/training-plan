import { beforeEach, describe, expect, it, vi } from "vitest";

const telegramServiceMocks = vi.hoisted(() => ({
  dbSelectMock: vi.fn(),
  dbInsertMock: vi.fn(),
  dbUpdateMock: vi.fn(),
  dbDeleteMock: vi.fn(),
  dbTransactionMock: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({
  db: {
    select: telegramServiceMocks.dbSelectMock,
    insert: telegramServiceMocks.dbInsertMock,
    update: telegramServiceMocks.dbUpdateMock,
    delete: telegramServiceMocks.dbDeleteMock,
    transaction: telegramServiceMocks.dbTransactionMock,
  },
}));

import {
  ensureLinked,
  getKeyboardRefreshTargets,
  getLinkedAccount,
  getLinkedAccountDetails,
  unlinkAccount,
} from "@/bot/services/telegramAccounts";
import {
  getEnabledSubscriptions,
  getSubscription,
  markSubscriptionSent,
  upsertSubscription,
} from "@/bot/services/telegramSubscriptions";

function mockSelectWhere(rows: unknown[]) {
  const whereMock = vi.fn().mockResolvedValue(rows);
  const builder = {
    from: vi.fn(() => builder),
    innerJoin: vi.fn(() => builder),
    leftJoin: vi.fn(() => builder),
    where: whereMock,
  };

  telegramServiceMocks.dbSelectMock.mockReturnValue(builder);

  return {
    builder,
    whereMock,
  };
}

function mockUpdateWhere() {
  const whereMock = vi.fn().mockResolvedValue(undefined);
  const setMock = vi.fn(() => ({
    where: whereMock,
  }));

  telegramServiceMocks.dbUpdateMock.mockReturnValue({
    set: setMock,
  });

  return {
    setMock,
    whereMock,
  };
}

function mockInsertValues() {
  const valuesMock = vi.fn().mockResolvedValue(undefined);

  telegramServiceMocks.dbInsertMock.mockReturnValue({
    values: valuesMock,
  });

  return valuesMock;
}

function createDeleteReturning(rows: unknown[]) {
  const returningMock = vi.fn().mockResolvedValue(rows);
  const whereMock = vi.fn(() => ({
    returning: returningMock,
  }));

  return {
    where: whereMock,
  };
}

describe("bot/services telegram", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен получать связанный аккаунт или null", async () => {
    mockSelectWhere([{ userId: 20 }]);

    await expect(getLinkedAccount(10)).resolves.toEqual({ userId: 20 });

    mockSelectWhere([]);

    await expect(getLinkedAccount(10)).resolves.toBeNull();
  });

  it("должен возвращать userId через ensureLinked", async () => {
    mockSelectWhere([{ userId: 20 }]);

    await expect(ensureLinked(10)).resolves.toBe(20);

    mockSelectWhere([]);

    await expect(ensureLinked(10)).resolves.toBeNull();
  });

  it("должен получать детали связанного Telegram аккаунта", async () => {
    mockSelectWhere([{ userId: 20, role: "admin", subscribed: null }]);

    await expect(getLinkedAccountDetails(10)).resolves.toEqual({
      userId: 20,
      role: "admin",
      subscribed: false,
    });

    mockSelectWhere([]);

    await expect(getLinkedAccountDetails(10)).resolves.toBeNull();
  });

  it("должен получать активные чаты для обновления клавиатуры", async () => {
    const rows = [
      { userId: 20, chatId: 100, subscribed: true },
      { userId: 30, chatId: 200, subscribed: null },
    ];
    mockSelectWhere(rows);

    await expect(getKeyboardRefreshTargets()).resolves.toEqual([
      { userId: 20, chatId: 100, subscribed: true },
      { userId: 30, chatId: 200, subscribed: false },
    ]);
  });

  it("должен удалять аккаунт и подписку в транзакции", async () => {
    const accountDeleteBuilder = createDeleteReturning([{ id: 1 }]);
    const subscriptionDeleteBuilder = createDeleteReturning([{ id: 2 }, { id: 3 }]);
    const tx = {
      delete: vi
        .fn()
        .mockReturnValueOnce(accountDeleteBuilder)
        .mockReturnValueOnce(subscriptionDeleteBuilder),
    };

    telegramServiceMocks.dbTransactionMock.mockImplementation(
      async (callback: (tx: any) => unknown) => {
        return await callback(tx);
      }
    );

    await expect(unlinkAccount(10)).resolves.toEqual({
      accounts: 1,
      subscriptions: 2,
    });
    expect(tx.delete).toHaveBeenCalledTimes(2);
  });

  it("должен получать подписку или null", async () => {
    mockSelectWhere([{ id: 1, timezone: "Europe/Moscow", sendTime: "07:30", enabled: true }]);

    await expect(getSubscription(20)).resolves.toEqual({
      id: 1,
      timezone: "Europe/Moscow",
      sendTime: "07:30",
      enabled: true,
    });

    mockSelectWhere([]);

    await expect(getSubscription(20)).resolves.toBeNull();
  });

  it("должен обновлять существующую подписку и таймзону пользователя", async () => {
    mockSelectWhere([{ id: 5 }]);
    const update = mockUpdateWhere();

    await upsertSubscription({
      userId: 20,
      chatId: 10,
      patch: {
        timezone: "Europe/Moscow",
        enabled: true,
      },
    });

    expect(update.setMock).toHaveBeenNthCalledWith(1, { timezone: "Europe/Moscow" });
    expect(update.setMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        enabled: true,
        updatedAt: expect.any(Date),
      })
    );
  });

  it("должен не обновлять подписку если есть только timezone patch", async () => {
    mockSelectWhere([{ id: 5 }]);
    const update = mockUpdateWhere();

    await upsertSubscription({
      userId: 20,
      chatId: 10,
      patch: {
        timezone: "Europe/Moscow",
      },
    });

    expect(update.setMock).toHaveBeenCalledTimes(1);
    expect(update.setMock).toHaveBeenCalledWith({ timezone: "Europe/Moscow" });
  });

  it("должен создавать подписку если записи еще нет", async () => {
    mockSelectWhere([]);
    const insertValuesMock = mockInsertValues();

    await upsertSubscription({
      userId: 20,
      chatId: 10,
      patch: {
        sendTime: "07:30",
      },
    });

    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 20,
        chatId: 10,
        enabled: false,
        sendTime: "07:30",
      })
    );
  });

  it("должен получать включенные подписки и отмечать отправку", async () => {
    const rows = [{ id: 1, userId: 20, chatId: 10 }];
    mockSelectWhere(rows);

    await expect(getEnabledSubscriptions()).resolves.toEqual(rows);

    const update = mockUpdateWhere();

    await markSubscriptionSent({ id: 1, sentOn: "2026-05-11" });

    expect(update.setMock).toHaveBeenCalledWith({
      lastSentOn: "2026-05-11",
      updatedAt: expect.any(Date),
    });
  });
});
