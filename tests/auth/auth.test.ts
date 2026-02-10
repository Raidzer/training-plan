import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  NextAuthMock,
  nextAuthHandlerMock,
  getServerSessionMock,
  credentialsProviderMock,
  bcryptCompareMock,
  getUserByIdentifierMock,
  getUserByIdMock,
} = vi.hoisted(() => {
  const nextAuthHandler = vi.fn();
  return {
    NextAuthMock: vi.fn(() => nextAuthHandler),
    nextAuthHandlerMock: nextAuthHandler,
    getServerSessionMock: vi.fn(),
    credentialsProviderMock: vi.fn((config) => config),
    bcryptCompareMock: vi.fn(),
    getUserByIdentifierMock: vi.fn(),
    getUserByIdMock: vi.fn(),
  };
});

vi.mock("next-auth", () => {
  return {
    default: NextAuthMock,
    getServerSession: getServerSessionMock,
  };
});

vi.mock("next-auth/providers/credentials", () => {
  return {
    default: credentialsProviderMock,
  };
});

vi.mock("bcryptjs", () => {
  return {
    default: {
      compare: bcryptCompareMock,
    },
  };
});

vi.mock("@/server/services/users", () => {
  return {
    getUserByIdentifier: getUserByIdentifierMock,
    getUserById: getUserByIdMock,
  };
});

import { auth, authOptions, handler } from "@/auth";

describe("auth.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserByIdentifierMock.mockResolvedValue(null);
    getUserByIdMock.mockResolvedValue(null);
    bcryptCompareMock.mockResolvedValue(false);
  });

  it("должен инициализировать NextAuth обработчик", () => {
    expect(NextAuthMock).toBeDefined();
    expect(handler).toBe(nextAuthHandlerMock);
    expect(authOptions.providers).toHaveLength(1);
  });

  describe("credentials authorize", () => {
    it("должен отклонять невалидный пейлоад", async () => {
      const provider = authOptions.providers[0] as unknown as {
        authorize: (creds: unknown) => Promise<unknown>;
      };

      const result = await provider.authorize({
        email: "a",
        password: "123456",
      });

      expect(result).toBeNull();
      expect(getUserByIdentifierMock).not.toHaveBeenCalled();
    });

    it("должен отклонять когда пользователь отсутствует", async () => {
      const provider = authOptions.providers[0] as unknown as {
        authorize: (creds: unknown) => Promise<unknown>;
      };
      getUserByIdentifierMock.mockResolvedValue(null);

      const result = await provider.authorize({
        email: "runner",
        password: "password123",
      });

      expect(result).toBeNull();
    });

    it("должен отклонять неактивного пользователя", async () => {
      const provider = authOptions.providers[0] as unknown as {
        authorize: (creds: unknown) => Promise<unknown>;
      };
      getUserByIdentifierMock.mockResolvedValue({
        id: 1,
        email: "runner@example.com",
        name: "Runner",
        role: "athlete",
        passwordHash: "hash",
        isActive: false,
        emailVerified: null,
      });

      const result = await provider.authorize({
        email: "runner",
        password: "password123",
      });

      expect(result).toBeNull();
      expect(bcryptCompareMock).not.toHaveBeenCalled();
    });

    it("должен отклонять неверный пароль", async () => {
      const provider = authOptions.providers[0] as unknown as {
        authorize: (creds: unknown) => Promise<unknown>;
      };
      getUserByIdentifierMock.mockResolvedValue({
        id: 1,
        email: "runner@example.com",
        name: "Runner",
        role: "athlete",
        passwordHash: "hash",
        isActive: true,
        emailVerified: null,
      });
      bcryptCompareMock.mockResolvedValue(false);

      const result = await provider.authorize({
        email: "runner",
        password: "password123",
      });

      expect(result).toBeNull();
      expect(bcryptCompareMock).toHaveBeenCalledWith("password123", "hash");
    });

    it("должен возвращать нормализованного пользователя при валидных учетных данных", async () => {
      const provider = authOptions.providers[0] as unknown as {
        authorize: (creds: unknown) => Promise<any>;
      };
      const emailVerified = new Date("2026-02-09T10:00:00.000Z");
      getUserByIdentifierMock.mockResolvedValue({
        id: 7,
        email: "runner@example.com",
        name: "Runner",
        role: "coach",
        passwordHash: "hash",
        isActive: true,
        emailVerified,
      });
      bcryptCompareMock.mockResolvedValue(true);

      const result = await provider.authorize({
        email: "runner",
        password: "password123",
      });

      expect(result).toEqual({
        id: "7",
        email: "runner@example.com",
        name: "Runner",
        role: "coach",
        emailVerified,
      });
    });
  });

  describe("callbacks", () => {
    it("колбэк сессии должен копировать кастомные поля токена в пользователя сессии", async () => {
      const sessionCallback = authOptions.callbacks?.session;
      const result = await sessionCallback?.({
        session: {
          user: {
            name: "Runner",
            email: "runner@example.com",
          } as any,
          expires: "never",
        },
        token: {
          sub: "11",
          role: "admin",
          emailVerified: "2026-01-01T00:00:00.000Z",
        } as any,
      } as any);

      expect(result?.user).toMatchObject({
        id: "11",
        role: "admin",
        emailVerified: "2026-01-01T00:00:00.000Z",
      });
    });

    it("jwt колбэк должен устанавливать поля из пользователя и обновлять по token.sub", async () => {
      const freshEmailVerified = new Date("2026-02-10T00:00:00.000Z");
      getUserByIdMock.mockResolvedValue({
        id: 5,
        role: "coach",
        emailVerified: freshEmailVerified,
        isActive: true,
      });
      const jwtCallback = authOptions.callbacks?.jwt;

      const token = await jwtCallback?.({
        token: { sub: "5" } as any,
        user: { role: "admin", emailVerified: null } as any,
      } as any);

      expect(token?.role).toBe("coach");
      expect(token?.emailVerified).toBe(freshEmailVerified);
      expect(getUserByIdMock).toHaveBeenCalledWith(5);
    });

    it("jwt колбэк должен сохранять поля токена, когда свежий пользователь не найден", async () => {
      getUserByIdMock.mockResolvedValue(null);
      const jwtCallback = authOptions.callbacks?.jwt;

      const token = await jwtCallback?.({
        token: { sub: "7", role: "athlete", emailVerified: null } as any,
      } as any);

      expect(token?.role).toBe("athlete");
      expect(token?.emailVerified).toBeNull();
    });
  });

  describe("auth()", () => {
    it("должен возвращать null когда сессия отсутствует", async () => {
      getServerSessionMock.mockResolvedValue(null);

      const result = await auth();

      expect(result).toBeNull();
    });

    it("должен возвращать null при невалидном id пользователя в сессии", async () => {
      getServerSessionMock.mockResolvedValue({
        user: { id: "bad-id" },
      });

      const result = await auth();

      expect(result).toBeNull();
    });

    it("должен возвращать null, когда пользователь отсутствует или неактивен", async () => {
      getServerSessionMock.mockResolvedValue({
        user: { id: "5", role: "coach" },
      });
      getUserByIdMock.mockResolvedValueOnce(null);

      const missingUser = await auth();
      expect(missingUser).toBeNull();

      getUserByIdMock.mockResolvedValueOnce({
        id: 5,
        role: "coach",
        emailVerified: null,
        isActive: false,
      });
      const inactiveUser = await auth();
      expect(inactiveUser).toBeNull();
    });

    it("должен возвращать сессию с обновленными полями пользователя", async () => {
      const verifiedAt = new Date("2026-02-09T10:00:00.000Z");
      getServerSessionMock.mockResolvedValue({
        user: { id: "5", role: "athlete", emailVerified: null, name: "Runner" },
        expires: "never",
      });
      getUserByIdMock.mockResolvedValue({
        id: 5,
        role: "admin",
        emailVerified: verifiedAt,
        isActive: true,
      });

      const result = await auth();

      expect(result).toEqual({
        user: {
          id: "5",
          role: "admin",
          emailVerified: verifiedAt,
          name: "Runner",
        },
        expires: "never",
      });
    });
  });
});
