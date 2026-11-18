import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteVerificationTokensByIdentifierAndType,
  generatePasswordResetToken,
  generateVerificationToken,
  getVerificationTokenByToken,
} from "@/server/tokens";
import { db } from "@/server/db/client";

const { dbTransactionMock } = vi.hoisted(() => ({
  dbTransactionMock: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({
  db: {
    transaction: dbTransactionMock,
    insert: vi.fn(() => ({ values: vi.fn() })),
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn() })) })),
    delete: vi.fn(() => ({ where: vi.fn() })),
  },
}));

function createSelectBuilder(rows: unknown[]) {
  const builder = {
    from: vi.fn(() => builder),
    where: vi.fn(() => builder),
    for: vi.fn().mockResolvedValue(rows),
  };

  return builder;
}

function createWriteBuilder() {
  const where = vi.fn().mockResolvedValue(undefined);
  const set = vi.fn(() => ({ where }));
  return { set, where };
}

describe("server/tokens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен сгенерировать verification token", async () => {
    const valuesMock = vi.fn();
    (db.insert as any).mockReturnValue({ values: valuesMock });

    const token = await generateVerificationToken("user@example.com");

    expect(typeof token).toBe("string");
    expect(valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: "user@example.com", token, type: "verify-email" })
    );
  });

  it("должен сериализовать выдачу reset-токена, удалять старые и записывать cooldown", async () => {
    const userQuery = createSelectBuilder([{ id: 1, passwordResetRequestedAt: null }]);
    const deleteWhereMock = vi.fn().mockResolvedValue(undefined);
    const updateBuilder = createWriteBuilder();
    const insertValuesMock = vi.fn().mockResolvedValue(undefined);
    const tx = {
      select: vi.fn().mockReturnValue(userQuery),
      delete: vi.fn(() => ({ where: deleteWhereMock })),
      update: vi.fn().mockReturnValue(updateBuilder),
      insert: vi.fn().mockReturnValue({ values: insertValuesMock }),
    };
    dbTransactionMock.mockImplementation(async (callback) => callback(tx));

    const token = await generatePasswordResetToken("user@example.com");

    expect(typeof token).toBe("string");
    expect(userQuery.for).toHaveBeenCalledWith("update");
    expect(tx.delete).toHaveBeenCalledTimes(1);
    expect(updateBuilder.set).toHaveBeenCalledWith({
      passwordResetRequestedAt: expect.any(Date),
    });
    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: "user@example.com", token, type: "reset-password" })
    );
  });

  it("должен сохранять cooldown после удаления токена", async () => {
    const userQuery = createSelectBuilder([
      { id: 1, passwordResetRequestedAt: new Date(Date.now() - 1_000) },
    ]);
    const tx = {
      select: vi.fn().mockReturnValue(userQuery),
      delete: vi.fn(),
      update: vi.fn(),
      insert: vi.fn(),
    };
    dbTransactionMock.mockImplementation(async (callback) => callback(tx));

    await expect(generatePasswordResetToken("user@example.com")).resolves.toBeNull();

    expect(tx.delete).not.toHaveBeenCalled();
    expect(tx.insert).not.toHaveBeenCalled();
  });

  it.each([{ id: 1, token: "some-token", identifier: "test@example.com" }, undefined])(
    "должен вернуть результат поиска токена: %j",
    async (mockResult) => {
      const whereMock = vi.fn().mockResolvedValue(mockResult ? [mockResult] : []);
      (db.select as any).mockReturnValue({ from: vi.fn(() => ({ where: whereMock })) });

      await expect(getVerificationTokenByToken("some-token")).resolves.toEqual(mockResult);
    }
  );

  it("должен удалить токены по identifier и type", async () => {
    const whereMock = vi.fn();
    (db.delete as any).mockReturnValue({ where: whereMock });

    await deleteVerificationTokensByIdentifierAndType("test@example.com", "verify-email");

    expect(whereMock).toHaveBeenCalled();
  });
});
