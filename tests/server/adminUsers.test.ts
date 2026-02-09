import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbUpdateMock } = vi.hoisted(() => {
  return {
    dbUpdateMock: vi.fn(),
  };
});

vi.mock("@/server/db/client", () => {
  return {
    db: {
      update: dbUpdateMock,
    },
  };
});

import {
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

describe("server/adminUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
