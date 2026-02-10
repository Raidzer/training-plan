import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbSelectMock, dbInsertMock } = vi.hoisted(() => {
  return {
    dbSelectMock: vi.fn(),
    dbInsertMock: vi.fn(),
  };
});

vi.mock("@/server/db/client", () => {
  return {
    db: {
      select: dbSelectMock,
      insert: dbInsertMock,
    },
  };
});

import {
  createRegistrationInvite,
  getRegistrationInvites,
  getUserSummaryById,
  getUsersByIds,
} from "@/server/adminInvites";

function mockSelectWhereResult(rows: unknown[]) {
  const whereMock = vi.fn().mockResolvedValue(rows);
  const fromMock = vi.fn(() => {
    return {
      where: whereMock,
    };
  });
  dbSelectMock.mockReturnValue({
    from: fromMock,
  });
  return {
    fromMock,
    whereMock,
  };
}

function mockSelectOrderByLimitResult(rows: unknown[]) {
  const limitMock = vi.fn().mockResolvedValue(rows);
  const orderByMock = vi.fn(() => {
    return {
      limit: limitMock,
    };
  });
  const fromMock = vi.fn(() => {
    return {
      orderBy: orderByMock,
    };
  });
  dbSelectMock.mockReturnValue({
    from: fromMock,
  });
  return {
    fromMock,
    orderByMock,
    limitMock,
  };
}

function mockInsertReturning(rows: unknown[]) {
  const returningMock = vi.fn().mockResolvedValue(rows);
  const valuesMock = vi.fn(() => {
    return {
      returning: returningMock,
    };
  });
  dbInsertMock.mockReturnValue({
    values: valuesMock,
  });
  return {
    valuesMock,
    returningMock,
  };
}

describe("server/adminInvites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getRegistrationInvites должен запрашивать строки с переданным limit", async () => {
    const rows = [{ id: 1 }, { id: 2 }];
    const { limitMock } = mockSelectOrderByLimitResult(rows);

    const result = await getRegistrationInvites(200);

    expect(result).toEqual(rows);
    expect(limitMock).toHaveBeenCalledWith(200);
  });

  it("getUsersByIds должен возвращать пустой список при пустом списке id", async () => {
    const result = await getUsersByIds([]);

    expect(result).toEqual([]);
    expect(dbSelectMock).not.toHaveBeenCalled();
  });

  it("getUsersByIds должен запрашивать пользователей при переданных id", async () => {
    const rows = [{ id: 10, name: "A", email: "a@example.com" }];
    mockSelectWhereResult(rows);

    const result = await getUsersByIds([10]);

    expect(result).toEqual(rows);
  });

  it("createRegistrationInvite должен возвращать созданный инвайт", async () => {
    const created = [
      {
        id: 7,
        role: "coach",
        createdAt: new Date("2026-02-09T10:00:00.000Z"),
        expiresAt: new Date("2026-02-10T10:00:00.000Z"),
      },
    ];
    const { valuesMock } = mockInsertReturning(created);

    const result = await createRegistrationInvite({
      tokenHash: "hash",
      role: "coach",
      createdByUserId: 1,
      expiresAt: new Date("2026-02-10T10:00:00.000Z"),
    });

    expect(result).toEqual(created[0]);
    expect(valuesMock).toHaveBeenCalledTimes(1);
  });

  it("createRegistrationInvite должен возвращать null когда вставлять возвращает no строки", async () => {
    mockInsertReturning([]);

    const result = await createRegistrationInvite({
      tokenHash: "hash",
      role: "coach",
      createdByUserId: 1,
      expiresAt: new Date("2026-02-10T10:00:00.000Z"),
    });

    expect(result).toBeNull();
  });

  it("getUserSummaryById должен возвращать пользователь или null", async () => {
    mockSelectWhereResult([{ id: 4, name: "Admin", email: "admin@example.com" }]);

    const present = await getUserSummaryById(4);
    expect(present).toEqual({ id: 4, name: "Admin", email: "admin@example.com" });

    mockSelectWhereResult([]);
    const missing = await getUserSummaryById(5);
    expect(missing).toBeNull();
  });
});
