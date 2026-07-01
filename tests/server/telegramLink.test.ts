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

  it("generateTelegramLinkToken должен возвращать payload для Telegram deep link", () => {
    const token = telegramLinkModule.generateTelegramLinkToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
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
    expect(result.linkToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(result.expiresAt.toISOString()).toBe("2026-02-09T10:15:00.000Z");
    expect(deleteWhereMock).toHaveBeenCalledTimes(1);
    expect(selectLimitMock).toHaveBeenCalledTimes(2);
    expect(selectLimitMock).toHaveBeenNthCalledWith(1, 1);
    expect(selectLimitMock).toHaveBeenNthCalledWith(2, 1);
    expect(insertValuesMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        userId: 5,
        codeHash: telegramLinkModule.hashTelegramLinkCode(result.code),
        consumedAt: null,
      })
    );
    expect(insertValuesMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        userId: 5,
        codeHash: telegramLinkModule.hashTelegramLinkCode(result.linkToken),
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
      .mockResolvedValueOnce([])
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
    expect(result.linkToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(selectLimitMock).toHaveBeenCalledTimes(3);
    expect(insertValuesMock).toHaveBeenNthCalledWith(
      1,
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

  it("buildTelegramBotUrl должен собирать ссылку при валидном username", () => {
    expect(telegramLinkModule.buildTelegramBotUrl("@RunLogBot")).toBe("https://t.me/RunLogBot");
  });

  it("buildTelegramBotUrl должен возвращать null без валидного username", () => {
    expect(telegramLinkModule.buildTelegramBotUrl("bad name")).toBeNull();
  });

  it("buildTelegramDeepLinkUrl должен собирать ссылку при валидном username", () => {
    expect(
      telegramLinkModule.buildTelegramDeepLinkUrl({
        username: "@RunLogBot",
        payload: "abc_123-XYZ",
      })
    ).toBe("https://t.me/RunLogBot?start=abc_123-XYZ");
  });

  it("buildTelegramDeepLinkUrl должен возвращать null без валидного username", () => {
    expect(
      telegramLinkModule.buildTelegramDeepLinkUrl({
        username: "bad name",
        payload: "abc_123-XYZ",
      })
    ).toBeNull();
  });
});
