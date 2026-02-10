import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbSelectMock, dbUpdateMock, dbDeleteMock } = vi.hoisted(() => {
  return {
    dbSelectMock: vi.fn(),
    dbUpdateMock: vi.fn(),
    dbDeleteMock: vi.fn(),
  };
});

vi.mock("@/server/db/client", () => {
  return {
    db: {
      select: dbSelectMock,
      update: dbUpdateMock,
      delete: dbDeleteMock,
    },
  };
});

import {
  deleteVerificationTokenById,
  getUserByEmail,
  markEmailVerifiedById,
  updateUserPasswordById,
} from "@/server/auth";

describe("server/auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getUserByEmail должен возвращать пользователь когда найден", async () => {
    const user = {
      id: 1,
      email: "user@example.com",
    };
    const whereMock = vi.fn().mockResolvedValue([user]);
    const fromMock = vi.fn(() => {
      return {
        where: whereMock,
      };
    });
    dbSelectMock.mockReturnValue({
      from: fromMock,
    });

    const result = await getUserByEmail("user@example.com");

    expect(result).toEqual(user);
    expect(dbSelectMock).toHaveBeenCalledTimes(1);
  });

  it("getUserByEmail должен возвращать null когда пользователь отсутствует", async () => {
    const whereMock = vi.fn().mockResolvedValue([]);
    const fromMock = vi.fn(() => {
      return {
        where: whereMock,
      };
    });
    dbSelectMock.mockReturnValue({
      from: fromMock,
    });

    const result = await getUserByEmail("missing@example.com");

    expect(result).toBeNull();
  });

  it("updateUserPasswordById должен обновлять пароль хешировать", async () => {
    const whereMock = vi.fn().mockResolvedValue(undefined);
    const setMock = vi.fn(() => {
      return {
        where: whereMock,
      };
    });
    dbUpdateMock.mockReturnValue({
      set: setMock,
    });

    await updateUserPasswordById(10, "hash-123");

    expect(dbUpdateMock).toHaveBeenCalledTimes(1);
    expect(setMock).toHaveBeenCalledWith({ passwordHash: "hash-123" });
    expect(whereMock).toHaveBeenCalledTimes(1);
  });

  it("markEmailVerifiedById должен устанавливать emailVerified дата", async () => {
    const whereMock = vi.fn().mockResolvedValue(undefined);
    const setMock = vi.fn(() => {
      return {
        where: whereMock,
      };
    });
    dbUpdateMock.mockReturnValue({
      set: setMock,
    });

    await markEmailVerifiedById(7);

    expect(dbUpdateMock).toHaveBeenCalledTimes(1);
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        emailVerified: expect.any(Date),
      })
    );
    expect(whereMock).toHaveBeenCalledTimes(1);
  });

  it("deleteVerificationTokenById должен удалять токен по id", async () => {
    const whereMock = vi.fn().mockResolvedValue(undefined);
    dbDeleteMock.mockReturnValue({
      where: whereMock,
    });

    await deleteVerificationTokenById(99);

    expect(dbDeleteMock).toHaveBeenCalledTimes(1);
    expect(whereMock).toHaveBeenCalledTimes(1);
  });
});
