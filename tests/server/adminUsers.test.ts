import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbTransactionMock, dbUpdateMock } = vi.hoisted(() => {
  return {
    dbTransactionMock: vi.fn(),
    dbUpdateMock: vi.fn(),
  };
});

vi.mock("@/server/db/client", () => {
  return {
    db: {
      transaction: dbTransactionMock,
      update: dbUpdateMock,
    },
  };
});

import {
  canDeleteUserRole,
  clearUserTrainingDataById,
  deleteUserAccountById,
  updateUserPasswordHashById,
  updateUserRoleById,
  updateUserStatusById,
} from "@/server/adminUsers";

function mockUpdateReturning(rows: unknown[]) {
  const returningMock = vi.fn().mockResolvedValue(rows);
  const whereMock = vi.fn(() => {
    return {
      returning: returningMock,
    };
  });
  const setMock = vi.fn(() => {
    return {
      where: whereMock,
    };
  });

  dbUpdateMock.mockReturnValue({
    set: setMock,
  });

  return {
    setMock,
    whereMock,
    returningMock,
  };
}

function createSelectLimitBuilder(rows: unknown[]) {
  const builder = {
    from: vi.fn(() => builder),
    where: vi.fn(() => builder),
    limit: vi.fn().mockResolvedValue(rows),
  };

  return builder;
}

function createSelectWhereBuilder(rows: unknown[]) {
  const builder = {
    from: vi.fn(() => builder),
    where: vi.fn().mockResolvedValue(rows),
  };

  return builder;
}

function createDeleteBuilder() {
  return {
    where: vi.fn().mockResolvedValue([]),
  };
}

describe("server/adminUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("canDeleteUserRole должен запрещать удаление администратора", () => {
    expect(canDeleteUserRole("athlete")).toBe(true);
    expect(canDeleteUserRole("coach")).toBe(true);
    expect(canDeleteUserRole("admin")).toBe(false);
  });

  it("updateUserPasswordHashById должен возвращать true, когда пользователь обновлен", async () => {
    mockUpdateReturning([{ id: 5 }]);

    const result = await updateUserPasswordHashById(5, "hash");

    expect(result).toBe(true);
    expect(dbUpdateMock).toHaveBeenCalledTimes(1);
  });

  it("updateUserPasswordHashById должен возвращать false когда пользователь отсутствует", async () => {
    mockUpdateReturning([]);

    const result = await updateUserPasswordHashById(5, "hash");

    expect(result).toBe(false);
  });

  it("updateUserRoleById должен возвращать обновленную роль пользователя", async () => {
    mockUpdateReturning([{ id: 7, role: "coach" }]);

    const result = await updateUserRoleById(7, "coach");

    expect(result).toEqual({ id: 7, role: "coach" });
  });

  it("updateUserRoleById должен возвращать null когда пользователь отсутствует", async () => {
    mockUpdateReturning([]);

    const result = await updateUserRoleById(7, "coach");

    expect(result).toBeNull();
  });

  it("updateUserStatusById должен возвращать обновленный флаг активности", async () => {
    mockUpdateReturning([{ id: 9, isActive: false }]);

    const result = await updateUserStatusById(9, false);

    expect(result).toEqual({ id: 9, isActive: false });
  });

  it("updateUserStatusById должен возвращать null когда пользователь отсутствует", async () => {
    mockUpdateReturning([]);

    const result = await updateUserStatusById(9, false);

    expect(result).toBeNull();
  });

  it("deleteUserAccountById должен запрещать удаление администратора до delete-запросов", async () => {
    const tx = {
      select: vi.fn().mockReturnValueOnce(
        createSelectLimitBuilder([
          {
            id: 1,
            email: "admin@example.com",
            role: "admin",
          },
        ])
      ),
      delete: vi.fn(),
    };

    dbTransactionMock.mockImplementation(async (callback) => {
      return await callback(tx);
    });

    const result = await deleteUserAccountById(1);

    expect(result).toEqual({ error: "forbidden" });
    expect(tx.delete).not.toHaveBeenCalled();
  });

  it("deleteUserAccountById должен удалять обычного пользователя транзакционно", async () => {
    const tx = {
      select: vi
        .fn()
        .mockReturnValueOnce(
          createSelectLimitBuilder([
            {
              id: 2,
              email: "runner@example.com",
              role: "athlete",
            },
          ])
        )
        .mockReturnValueOnce(createSelectWhereBuilder([{ id: 10 }]))
        .mockReturnValueOnce(createSelectWhereBuilder([{ id: 20 }]))
        .mockReturnValueOnce(createSelectWhereBuilder([{ id: 30 }])),
      delete: vi.fn(() => createDeleteBuilder()),
    };

    dbTransactionMock.mockImplementation(async (callback) => {
      return await callback(tx);
    });

    const result = await deleteUserAccountById(2);

    expect(result).toEqual({ deleted: true });
    expect(tx.delete).toHaveBeenCalled();
  });

  it("clearUserTrainingDataById должен возвращать not_found без delete-запросов", async () => {
    const tx = {
      select: vi.fn().mockReturnValueOnce(createSelectLimitBuilder([])),
      delete: vi.fn(),
    };

    dbTransactionMock.mockImplementation(async (callback) => {
      return await callback(tx);
    });

    const result = await clearUserTrainingDataById(99);

    expect(result).toEqual({ error: "not_found" });
    expect(tx.delete).not.toHaveBeenCalled();
  });

  it("clearUserTrainingDataById должен очищать план и дневник транзакционно", async () => {
    const tx = {
      select: vi
        .fn()
        .mockReturnValueOnce(createSelectLimitBuilder([{ id: 2 }]))
        .mockReturnValueOnce(createSelectWhereBuilder([{ id: 10 }]))
        .mockReturnValueOnce(createSelectWhereBuilder([{ id: 20 }])),
      delete: vi.fn(() => createDeleteBuilder()),
    };

    dbTransactionMock.mockImplementation(async (callback) => {
      return await callback(tx);
    });

    const result = await clearUserTrainingDataById(2);

    expect(result).toEqual({ cleared: true });
    expect(tx.delete).toHaveBeenCalled();
  });
});
