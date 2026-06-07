import { beforeEach, describe, expect, it, vi } from "vitest";

const linkingMocks = vi.hoisted(() => ({
  dbTransactionMock: vi.fn(),
  hashTelegramLinkCodeMock: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({
  db: {
    transaction: linkingMocks.dbTransactionMock,
  },
}));

vi.mock("@/server/telegramLink", () => ({
  hashTelegramLinkCode: linkingMocks.hashTelegramLinkCodeMock,
}));

import { linkAccount } from "@/bot/services/telegramLinking";

function createSelectFactory(selectQueue: unknown[]) {
  let selectIndex = 0;

  return vi.fn(() => {
    selectIndex += 1;
    const builder: any = {};
    const isCodeLookup = selectIndex === 1;

    builder.from = vi.fn(() => builder);
    builder.where = vi.fn(() => {
      if (isCodeLookup) {
        return builder;
      }

      const next = selectQueue.shift();
      return Promise.resolve(next);
    });
    builder.orderBy = vi.fn(() => builder);
    builder.limit = vi.fn(() => {
      const next = selectQueue.shift();
      return Promise.resolve(next);
    });

    return builder;
  });
}

function createTx(selectQueue: unknown[]) {
  const insertValuesMock = vi.fn().mockResolvedValue(undefined);
  const updateWhereMock = vi.fn().mockResolvedValue(undefined);

  const tx = {
    select: createSelectFactory(selectQueue),
    insert: vi.fn(() => ({
      values: insertValuesMock,
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: updateWhereMock,
      })),
    })),
  };

  return {
    tx,
    insertValuesMock,
    updateWhereMock,
  };
}

describe("bot/services/telegramLinking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    linkingMocks.hashTelegramLinkCodeMock.mockImplementation((code: string) => `hash:${code}`);
  });

  it("должен отклонять недействительный код", async () => {
    const { tx } = createTx([[]]);
    linkingMocks.dbTransactionMock.mockImplementation(async (callback: (tx: any) => unknown) => {
      return await callback(tx);
    });

    await expect(linkAccount({ chatId: 10, code: "123456" })).resolves.toEqual({
      ok: false,
      error: "код-недействителен",
    });
  });

  it("должен отклонять уже связанный чат", async () => {
    const { tx } = createTx([[{ id: 1, userId: 20 }], [{ userId: 30 }]]);
    linkingMocks.dbTransactionMock.mockImplementation(async (callback: (tx: any) => unknown) => {
      return await callback(tx);
    });

    await expect(linkAccount({ chatId: 10, code: "123456" })).resolves.toEqual({
      ok: false,
      error: "чат-уже-связан",
    });
  });

  it("должен отклонять уже связанного пользователя", async () => {
    const { tx } = createTx([[{ id: 1, userId: 20 }], [], [{ userId: 20 }]]);
    linkingMocks.dbTransactionMock.mockImplementation(async (callback: (tx: any) => unknown) => {
      return await callback(tx);
    });

    await expect(linkAccount({ chatId: 10, code: "123456" })).resolves.toEqual({
      ok: false,
      error: "пользователь-уже-связан",
    });
  });

  it("должен связывать аккаунт и обновлять существующую подписку", async () => {
    const { tx, insertValuesMock, updateWhereMock } = createTx([
      [{ id: 1, userId: 20 }],
      [],
      [],
      [{ id: 5 }],
    ]);
    linkingMocks.dbTransactionMock.mockImplementation(async (callback: (tx: any) => unknown) => {
      return await callback(tx);
    });

    await expect(
      linkAccount({
        chatId: 10,
        code: "123456",
        username: "runner",
        firstName: "Runner",
      })
    ).resolves.toEqual({ ok: true });

    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 20,
        chatId: 10,
        username: "runner",
        firstName: "Runner",
      })
    );
    expect(updateWhereMock).toHaveBeenCalledTimes(2);
  });

  it("должен создавать подписку если ее еще нет", async () => {
    const { tx, insertValuesMock } = createTx([[{ id: 1, userId: 20 }], [], [], []]);
    linkingMocks.dbTransactionMock.mockImplementation(async (callback: (tx: any) => unknown) => {
      return await callback(tx);
    });

    await expect(linkAccount({ chatId: 10, code: "123456" })).resolves.toEqual({ ok: true });

    expect(insertValuesMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        userId: 20,
        chatId: 10,
        enabled: false,
      })
    );
  });
});
