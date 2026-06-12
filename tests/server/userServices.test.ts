import { beforeEach, describe, expect, it, vi } from "vitest";

const userServiceMocks = vi.hoisted(() => ({
  dbSelectMock: vi.fn(),
  dbUpdateMock: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({
  db: {
    select: userServiceMocks.dbSelectMock,
    update: userServiceMocks.dbUpdateMock,
  },
}));

import {
  getUserById,
  getUserDeletionCredentialsById,
  getUserByIdentifier,
  getUserEmailCredentialsById,
  getUserPasswordHashById,
  getUserProfileById,
  shouldUpdateLastActiveAt,
  touchUserLastActiveAtById,
  touchUserLastActiveAtIfNeeded,
  updateUserEmailById,
  updateUserPasswordHashById,
  updateUserProfileById,
} from "@/server/services/users";

function mockSelectLimit(rows: unknown[]) {
  const limitMock = vi.fn().mockResolvedValue(rows);
  const builder = {
    from: vi.fn(() => builder),
    where: vi.fn(() => builder),
    limit: limitMock,
  };

  userServiceMocks.dbSelectMock.mockReturnValue(builder);
}

function mockUpdateReturning(rows: unknown[]) {
  const returningMock = vi.fn().mockResolvedValue(rows);
  const whereMock = vi.fn(() => ({
    returning: returningMock,
  }));
  const setMock = vi.fn(() => ({
    where: whereMock,
  }));

  userServiceMocks.dbUpdateMock.mockReturnValue({
    set: setMock,
  });

  return {
    setMock,
    whereMock,
    returningMock,
  };
}

describe("server/services/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен получать пользователя по идентификатору или id", async () => {
    const user = { id: 1, email: "runner@example.com" };
    mockSelectLimit([user]);

    await expect(getUserByIdentifier("runner")).resolves.toEqual(user);

    mockSelectLimit([]);

    await expect(getUserByIdentifier("missing")).resolves.toBeNull();

    mockSelectLimit([user]);

    await expect(getUserById(1)).resolves.toEqual(user);
  });

  it("должен получать профиль пользователя и учетные данные", async () => {
    const profile = { id: 1, login: "runner" };
    const credentials = { id: 1, email: "runner@example.com", passwordHash: "hash" };
    const password = { id: 1, passwordHash: "hash" };

    mockSelectLimit([profile]);
    await expect(getUserProfileById(1)).resolves.toEqual(profile);

    mockSelectLimit([credentials]);
    await expect(getUserEmailCredentialsById(1)).resolves.toEqual(credentials);

    mockSelectLimit([password]);
    await expect(getUserPasswordHashById(1)).resolves.toEqual(password);

    mockSelectLimit([{ id: 1, email: "test@example.com", role: "athlete", passwordHash: "hash" }]);
    await expect(getUserDeletionCredentialsById(1)).resolves.toEqual({
      id: 1,
      email: "test@example.com",
      role: "athlete",
      passwordHash: "hash",
    });

    mockSelectLimit([]);
    await expect(getUserPasswordHashById(2)).resolves.toBeNull();
  });

  it("должен обновлять профиль, email и пароль", async () => {
    const profile = { id: 1, email: "runner@example.com", name: "Runner" };
    mockUpdateReturning([profile]);

    await expect(
      updateUserProfileById(1, {
        name: "Runner",
        lastName: "",
        gender: "male",
        timezone: "Europe/Moscow",
      })
    ).resolves.toEqual(profile);

    mockUpdateReturning([profile]);
    await expect(updateUserEmailById(1, "new@example.com")).resolves.toEqual(profile);

    mockUpdateReturning([{ id: 1 }]);
    await expect(updateUserPasswordHashById(1, "hash")).resolves.toEqual({ id: 1 });

    mockUpdateReturning([]);
    await expect(updateUserPasswordHashById(2, "hash")).resolves.toBeNull();
  });

  it("shouldUpdateLastActiveAt должен учитывать интервал обновления активности", () => {
    const now = new Date("2026-06-12T10:15:00.000Z");

    expect(shouldUpdateLastActiveAt(null, now)).toBe(true);
    expect(shouldUpdateLastActiveAt(new Date("2026-06-12T10:01:00.000Z"), now)).toBe(false);
    expect(shouldUpdateLastActiveAt(new Date("2026-06-12T10:00:00.000Z"), now)).toBe(true);
  });

  it("touchUserLastActiveAtById должен обновлять дату активности пользователя", async () => {
    const now = new Date("2026-06-12T10:15:00.000Z");
    const { setMock, whereMock } = mockUpdateReturning([]);

    await touchUserLastActiveAtById(3, now);

    expect(setMock).toHaveBeenCalledWith({ lastActiveAt: now });
    expect(whereMock).toHaveBeenCalledTimes(1);
  });

  it("touchUserLastActiveAtIfNeeded должен пропускать свежую активность", async () => {
    const now = new Date("2026-06-12T10:15:00.000Z");

    await touchUserLastActiveAtIfNeeded(
      {
        id: 3,
        lastActiveAt: new Date("2026-06-12T10:01:00.000Z"),
      },
      now
    );

    expect(userServiceMocks.dbUpdateMock).not.toHaveBeenCalled();
  });

  it("touchUserLastActiveAtIfNeeded должен обновлять устаревшую активность", async () => {
    const now = new Date("2026-06-12T10:15:00.000Z");
    const { setMock } = mockUpdateReturning([]);

    await touchUserLastActiveAtIfNeeded(
      {
        id: 3,
        lastActiveAt: new Date("2026-06-12T10:00:00.000Z"),
      },
      now
    );

    expect(setMock).toHaveBeenCalledWith({ lastActiveAt: now });
  });
});
