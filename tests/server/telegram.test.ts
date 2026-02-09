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
});
