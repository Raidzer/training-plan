import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAdminSession,
  createJsonRequest,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";

const {
  authMock,
  buildInviteExpiryMock,
  generateInviteTokenMock,
  hashInviteTokenMock,
  createRegistrationInviteMock,
  getRegistrationInvitesMock,
  getUserSummaryByIdMock,
  getUsersByIdsMock,
} = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    buildInviteExpiryMock: vi.fn(),
    generateInviteTokenMock: vi.fn(),
    hashInviteTokenMock: vi.fn(),
    createRegistrationInviteMock: vi.fn(),
    getRegistrationInvitesMock: vi.fn(),
    getUserSummaryByIdMock: vi.fn(),
    getUsersByIdsMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("@/server/registrationInvites", () => {
  return {
    buildInviteExpiry: buildInviteExpiryMock,
    generateInviteToken: generateInviteTokenMock,
    hashInviteToken: hashInviteTokenMock,
  };
});

vi.mock("@/server/adminInvites", () => {
  return {
    createRegistrationInvite: createRegistrationInviteMock,
    getRegistrationInvites: getRegistrationInvitesMock,
    getUserSummaryById: getUserSummaryByIdMock,
    getUsersByIds: getUsersByIdsMock,
  };
});

import { GET, POST } from "@/app/api/admin/invites/route";

describe("API /api/admin/invites route", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-09T10:00:00.000Z"));
    vi.clearAllMocks();

    authMock.mockResolvedValue(createAdminSession({ id: "100" }));
    getRegistrationInvitesMock.mockResolvedValue([]);
    getUsersByIdsMock.mockResolvedValue([]);
    buildInviteExpiryMock.mockReturnValue(new Date("2026-02-10T10:00:00.000Z"));
    generateInviteTokenMock.mockReturnValue("raw-token");
    hashInviteTokenMock.mockReturnValue("hashed-token");
    createRegistrationInviteMock.mockResolvedValue({
      id: 7,
      role: "athlete",
      createdAt: new Date("2026-02-09T09:00:00.000Z"),
      expiresAt: new Date("2026-02-10T10:00:00.000Z"),
    });
    getUserSummaryByIdMock.mockResolvedValue({
      id: 100,
      name: "Admin",
      email: "admin@example.com",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("GET", () => {
    it("должен возвращать 401 без сессии", async () => {
      authMock.mockResolvedValue(null);

      const response = await GET();

      await expectJsonError(response, 401, "unauthorized");
    });

    it("должен возвращать 403 при не-админе", async () => {
      authMock.mockResolvedValue(createSession({ id: "100", role: "athlete" }));

      const response = await GET();

      await expectJsonError(response, 403, "forbidden");
    });

    it("должен возвращать инвайты с рассчитанными статусами", async () => {
      getRegistrationInvitesMock.mockResolvedValue([
        {
          id: 1,
          role: "coach",
          createdByUserId: 10,
          usedByUserId: null,
          createdAt: new Date("2026-02-09T08:00:00.000Z"),
          expiresAt: new Date("2026-02-09T11:00:00.000Z"),
          usedAt: null,
        },
        {
          id: 2,
          role: "athlete",
          createdByUserId: 10,
          usedByUserId: 20,
          createdAt: new Date("2026-02-08T08:00:00.000Z"),
          expiresAt: new Date("2026-02-09T11:00:00.000Z"),
          usedAt: new Date("2026-02-08T09:00:00.000Z"),
        },
        {
          id: 3,
          role: "athlete",
          createdByUserId: 30,
          usedByUserId: null,
          createdAt: new Date("2026-02-07T08:00:00.000Z"),
          expiresAt: new Date("2026-02-09T09:00:00.000Z"),
          usedAt: null,
        },
      ]);
      getUsersByIdsMock.mockResolvedValue([
        { id: 10, name: "Creator", email: "creator@example.com" },
        { id: 20, name: "Used", email: "used@example.com" },
      ]);

      const response = await GET();
      const payload = await expectJsonSuccess<{
        invites: Array<{ id: number; status: string; createdBy: unknown; usedBy: unknown }>;
      }>(response, 200);

      expect(payload.invites).toHaveLength(3);
      expect(payload.invites[0].status).toBe("active");
      expect(payload.invites[1].status).toBe("used");
      expect(payload.invites[2].status).toBe("expired");
      expect(payload.invites[0].createdBy).toEqual({
        id: 10,
        name: "Creator",
        email: "creator@example.com",
      });
      expect(payload.invites[1].usedBy).toEqual({
        id: 20,
        name: "Used",
        email: "used@example.com",
      });
      expect(getRegistrationInvitesMock).toHaveBeenCalledWith(200);
      expect(getUsersByIdsMock).toHaveBeenCalledWith(expect.arrayContaining([10, 20, 30]));
    });
  });

  describe("POST", () => {
    it("должен возвращать 401 без сессии", async () => {
      authMock.mockResolvedValue(null);
      const request = createJsonRequest({
        url: "http://localhost/api/admin/invites",
        body: { role: "athlete" },
      });

      const response = await POST(request);

      await expectJsonError(response, 401, "unauthorized");
    });

    it("должен возвращать 403 при не-админе", async () => {
      authMock.mockResolvedValue(createSession({ id: "100", role: "athlete" }));
      const request = createJsonRequest({
        url: "http://localhost/api/admin/invites",
        body: { role: "athlete" },
      });

      const response = await POST(request);

      await expectJsonError(response, 403, "forbidden");
    });

    it("должен возвращать 401, когда id админа невалидный", async () => {
      authMock.mockResolvedValue(createAdminSession({ id: "bad-id" }));
      const request = createJsonRequest({
        url: "http://localhost/api/admin/invites",
        body: { role: "athlete" },
      });

      const response = await POST(request);

      await expectJsonError(response, 401, "unauthorized");
    });

    it("должен возвращать 400 при невалидном пейлоад", async () => {
      const request = createJsonRequest({
        url: "http://localhost/api/admin/invites",
        body: { role: "admin" },
      });

      const response = await POST(request);

      await expectJsonError(response, 400, "invalid_payload");
    });

    it("должен возвращать 500, когда создание инвайта не удалось", async () => {
      createRegistrationInviteMock.mockResolvedValue(null);
      const request = createJsonRequest({
        url: "http://localhost/api/admin/invites",
        body: { role: "coach" },
      });

      const response = await POST(request);

      await expectJsonError(response, 500, "create_failed");
    });

    it("должен создавать инвайт и возвращать токен", async () => {
      const request = createJsonRequest({
        url: "http://localhost/api/admin/invites",
        body: { role: "athlete" },
      });

      const response = await POST(request);
      const payload = await expectJsonSuccess<{
        token: string;
        invite: {
          id: number;
          role: string;
          status: string;
          createdBy: { id: number; name: string; email: string } | null;
        };
      }>(response, 200);

      expect(payload.token).toBe("raw-token");
      expect(payload.invite.role).toBe("athlete");
      expect(payload.invite.status).toBe("active");
      expect(payload.invite.createdBy).toEqual({
        id: 100,
        name: "Admin",
        email: "admin@example.com",
      });

      expect(generateInviteTokenMock).toHaveBeenCalledTimes(1);
      expect(hashInviteTokenMock).toHaveBeenCalledWith("raw-token");
      expect(buildInviteExpiryMock).toHaveBeenCalledTimes(1);
      expect(createRegistrationInviteMock).toHaveBeenCalledWith({
        tokenHash: "hashed-token",
        role: "athlete",
        createdByUserId: 100,
        expiresAt: new Date("2026-02-10T10:00:00.000Z"),
      });
      expect(getUserSummaryByIdMock).toHaveBeenCalledWith(100);
    });
  });
});
