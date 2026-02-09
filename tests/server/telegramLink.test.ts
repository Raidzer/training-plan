import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbDeleteMock, dbSelectMock, dbInsertMock } = vi.hoisted(() => {
  return {
    dbDeleteMock: vi.fn(),
    dbSelectMock: vi.fn(),
    dbInsertMock: vi.fn(),
  };
});

vi.mock("@/server/db/client", () => {
  return {
    db: {
      delete: dbDeleteMock,
      select: dbSelectMock,
      insert: dbInsertMock,
    },
  };
});

import * as telegramLinkModule from "@/server/telegramLink";

describe("server/telegramLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TELEGRAM_LINK_SECRET = "test-secret";
  });

  it("generateTelegramLinkCode должен возвращать 6-цифровой код", () => {
    const code = telegramLinkModule.generateTelegramLinkCode();

    expect(code).toMatch(/^\d{6}$/);
  });

  it("hashTelegramLinkCode должен быть детерминированным", () => {
    const hashA = telegramLinkModule.hashTelegramLinkCode("123456");
    const hashB = telegramLinkModule.hashTelegramLinkCode("123456");

    expect(hashA).toBe(hashB);
    expect(hashA).toMatch(/^[a-f0-9]{64}$/);
  });

  it("issueTelegramLinkCode должен очищать предыдущие коды и вставлять новый", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-09T10:00:00.000Z"));

    const deleteWhereMock = vi.fn().mockResolvedValue(undefined);
    dbDeleteMock.mockReturnValue({
      where: deleteWhereMock,
    });

    const selectLimitMock = vi.fn().mockResolvedValue([]);
    dbSelectMock.mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: selectLimitMock,
        })),
      })),
    });

    const insertValuesMock = vi.fn().mockResolvedValue(undefined);
    dbInsertMock.mockReturnValue({
      values: insertValuesMock,
    });

    const result = await telegramLinkModule.issueTelegramLinkCode({ userId: 5 });

    expect(result.code).toMatch(/^\d{6}$/);
    expect(result.expiresAt.toISOString()).toBe("2026-02-09T10:15:00.000Z");
    expect(deleteWhereMock).toHaveBeenCalledTimes(1);
    expect(selectLimitMock).toHaveBeenCalledWith(1);
    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 5,
        codeHash: telegramLinkModule.hashTelegramLinkCode(result.code),
        consumedAt: null,
      })
    );

    vi.useRealTimers();
  });

  it("issueTelegramLinkCode должен повторять попытку, когда возникает коллизия кода", async () => {
    const deleteWhereMock = vi.fn().mockResolvedValue(undefined);
    dbDeleteMock.mockReturnValue({
      where: deleteWhereMock,
    });

    const selectLimitMock = vi
      .fn()
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([]);
    dbSelectMock.mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: selectLimitMock,
        })),
      })),
    });

    const insertValuesMock = vi.fn().mockResolvedValue(undefined);
    dbInsertMock.mockReturnValue({
      values: insertValuesMock,
    });

    const result = await telegramLinkModule.issueTelegramLinkCode({ userId: 5 });

    expect(result.code).toMatch(/^\d{6}$/);
    expect(selectLimitMock).toHaveBeenCalledTimes(2);
    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        codeHash: telegramLinkModule.hashTelegramLinkCode(result.code),
      })
    );
  });

  it("issueTelegramLinkCode должен выбрасывать ошибку после максимального числа попыток", async () => {
    dbDeleteMock.mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
    const selectLimitMock = vi.fn().mockResolvedValue([{ id: 1 }]);
    dbSelectMock.mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: selectLimitMock,
        })),
      })),
    });

    const codeSpy = vi
      .spyOn(telegramLinkModule, "generateTelegramLinkCode")
      .mockReturnValue("999999");

    await expect(telegramLinkModule.issueTelegramLinkCode({ userId: 5 })).rejects.toThrow(
      "Failed to issue telegram link code"
    );
    expect(selectLimitMock).toHaveBeenCalledTimes(5);

    codeSpy.mockRestore();
  });
});
