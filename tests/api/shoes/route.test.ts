import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createJsonRequest,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";

const { authMock, listShoesByUserMock, createShoeMock } = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    listShoesByUserMock: vi.fn(),
    createShoeMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("@/server/shoes", () => {
  return {
    listShoesByUser: listShoesByUserMock,
    createShoe: createShoeMock,
  };
});

import { GET, POST } from "@/app/api/shoes/route";

describe("API /api/shoes route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "13" }));
    listShoesByUserMock.mockResolvedValue([
      {
        id: 1,
        name: "Pegasus",
        createdAt: new Date("2026-01-01T10:00:00.000Z"),
        updatedAt: new Date("2026-01-02T10:00:00.000Z"),
      },
    ]);
    createShoeMock.mockResolvedValue({
      id: 2,
      name: "Vaporfly",
      createdAt: new Date("2026-01-03T10:00:00.000Z"),
      updatedAt: new Date("2026-01-03T10:00:00.000Z"),
    });
  });

  describe("GET", () => {
    it("should return 401 without session", async () => {
      authMock.mockResolvedValue(null);

      const response = await GET();

      await expectJsonError(response, 401, "unauthorized");
      expect(listShoesByUserMock).not.toHaveBeenCalled();
    });

    it("should return 401 for invalid user id", async () => {
      authMock.mockResolvedValue(createSession({ id: "bad-id" }));

      const response = await GET();

      await expectJsonError(response, 401, "unauthorized");
      expect(listShoesByUserMock).not.toHaveBeenCalled();
    });

    it("should return shoes list for authorized user", async () => {
      const response = await GET();
      const payload = await expectJsonSuccess<{
        shoes: Array<{ id: number; name: string }>;
      }>(response, 200);

      expect(payload.shoes).toHaveLength(1);
      expect(payload.shoes[0].name).toBe("Pegasus");
      expect(listShoesByUserMock).toHaveBeenCalledWith(13);
    });
  });

  describe("POST", () => {
    it("should return 401 without session", async () => {
      authMock.mockResolvedValue(null);
      const request = createJsonRequest({
        url: "http://localhost/api/shoes",
        body: { name: "Vaporfly" },
      });

      const response = await POST(request);
      await expectJsonError(response, 401, "unauthorized");
    });

    it("should return 401 for invalid user id", async () => {
      authMock.mockResolvedValue(createSession({ id: "bad-id" }));
      const request = createJsonRequest({
        url: "http://localhost/api/shoes",
        body: { name: "Vaporfly" },
      });

      const response = await POST(request);
      await expectJsonError(response, 401, "unauthorized");
    });

    it("should return 400 for invalid body", async () => {
      const request = createJsonRequest({
        url: "http://localhost/api/shoes",
        body: {},
      });

      const response = await POST(request);
      await expectJsonError(response, 400, "invalid_name");
      expect(createShoeMock).not.toHaveBeenCalled();
    });

    it("should return 400 for too long name", async () => {
      const request = createJsonRequest({
        url: "http://localhost/api/shoes",
        body: { name: "x".repeat(256) },
      });

      const response = await POST(request);
      await expectJsonError(response, 400, "invalid_name");
      expect(createShoeMock).not.toHaveBeenCalled();
    });

    it("should create shoe with trimmed name", async () => {
      const request = createJsonRequest({
        url: "http://localhost/api/shoes",
        body: { name: "  Vaporfly  " },
      });

      const response = await POST(request);
      const payload = await expectJsonSuccess<{ shoe: { id: number; name: string } }>(
        response,
        201
      );

      expect(payload.shoe.name).toBe("Vaporfly");
      expect(createShoeMock).toHaveBeenCalledWith({
        userId: 13,
        name: "Vaporfly",
      });
    });
  });
});
