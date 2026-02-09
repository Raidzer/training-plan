import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createJsonRequest,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";

const { authMock, updateShoeMock, deleteShoeMock } = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    updateShoeMock: vi.fn(),
    deleteShoeMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("@/server/shoes", () => {
  return {
    updateShoe: updateShoeMock,
    deleteShoe: deleteShoeMock,
  };
});

import { DELETE, PATCH } from "@/app/api/shoes/[shoeId]/route";

function createRouteContext(shoeId: string) {
  return {
    params: Promise.resolve({ shoeId }),
  };
}

describe("API /api/shoes/[shoeId] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "44" }));
    updateShoeMock.mockResolvedValue({
      id: 7,
      name: "Pegasus",
      createdAt: new Date("2026-01-01T10:00:00.000Z"),
      updatedAt: new Date("2026-01-04T10:00:00.000Z"),
    });
    deleteShoeMock.mockResolvedValue(true);
  });

  describe("PATCH", () => {
    it("должен возвращать 401 без сессии", async () => {
      authMock.mockResolvedValue(null);
      const request = createJsonRequest({
        url: "http://localhost/api/shoes/7",
        method: "PATCH",
        body: { name: "Pegasus" },
      });

      const response = await PATCH(request, createRouteContext("7"));
      await expectJsonError(response, 401, "unauthorized");
    });

    it("должен возвращать 401 при невалидном id пользователя", async () => {
      authMock.mockResolvedValue(createSession({ id: "bad-id" }));
      const request = createJsonRequest({
        url: "http://localhost/api/shoes/7",
        method: "PATCH",
        body: { name: "Pegasus" },
      });

      const response = await PATCH(request, createRouteContext("7"));
      await expectJsonError(response, 401, "unauthorized");
    });

    it("должен возвращать 400 при невалидном id кроссовка", async () => {
      const request = createJsonRequest({
        url: "http://localhost/api/shoes/bad-id",
        method: "PATCH",
        body: { name: "Pegasus" },
      });

      const response = await PATCH(request, createRouteContext("bad-id"));
      await expectJsonError(response, 400, "invalid_shoe_id");
    });

    it("должен возвращать 400 при невалидном название кроссовка", async () => {
      const request = createJsonRequest({
        url: "http://localhost/api/shoes/7",
        method: "PATCH",
        body: { name: "   " },
      });

      const response = await PATCH(request, createRouteContext("7"));
      await expectJsonError(response, 400, "invalid_name");
      expect(updateShoeMock).not.toHaveBeenCalled();
    });

    it("должен возвращать 404 когда кроссовок отсутствует", async () => {
      updateShoeMock.mockResolvedValue(null);
      const request = createJsonRequest({
        url: "http://localhost/api/shoes/7",
        method: "PATCH",
        body: { name: "Pegasus" },
      });

      const response = await PATCH(request, createRouteContext("7"));
      await expectJsonError(response, 404, "not_found");
    });

    it("должен обновлять кроссовок с обрезанным названием", async () => {
      const request = createJsonRequest({
        url: "http://localhost/api/shoes/7",
        method: "PATCH",
        body: { name: "  Pegasus  " },
      });

      const response = await PATCH(request, createRouteContext("7"));
      const payload = await expectJsonSuccess<{ shoe: { id: number; name: string } }>(
        response,
        200
      );

      expect(payload.shoe.id).toBe(7);
      expect(updateShoeMock).toHaveBeenCalledWith({
        userId: 44,
        shoeId: 7,
        name: "Pegasus",
      });
    });
  });

  describe("DELETE", () => {
    it("должен возвращать 401 без сессии", async () => {
      authMock.mockResolvedValue(null);

      const response = await DELETE(
        createJsonRequest({
          url: "http://localhost/api/shoes/7",
          method: "DELETE",
          body: {},
        }),
        createRouteContext("7")
      );

      await expectJsonError(response, 401, "unauthorized");
    });

    it("должен возвращать 401 при невалидном id пользователя", async () => {
      authMock.mockResolvedValue(createSession({ id: "bad-id" }));

      const response = await DELETE(
        createJsonRequest({
          url: "http://localhost/api/shoes/7",
          method: "DELETE",
          body: {},
        }),
        createRouteContext("7")
      );

      await expectJsonError(response, 401, "unauthorized");
    });

    it("должен возвращать 400 при невалидном id кроссовка", async () => {
      const response = await DELETE(
        createJsonRequest({
          url: "http://localhost/api/shoes/bad-id",
          method: "DELETE",
          body: {},
        }),
        createRouteContext("bad-id")
      );

      await expectJsonError(response, 400, "invalid_shoe_id");
    });

    it("должен возвращать 404 когда кроссовок отсутствует", async () => {
      deleteShoeMock.mockResolvedValue(false);

      const response = await DELETE(
        createJsonRequest({
          url: "http://localhost/api/shoes/7",
          method: "DELETE",
          body: {},
        }),
        createRouteContext("7")
      );

      await expectJsonError(response, 404, "not_found");
    });

    it("должен удалять кроссовок при валидном запрос", async () => {
      const response = await DELETE(
        createJsonRequest({
          url: "http://localhost/api/shoes/7",
          method: "DELETE",
          body: {},
        }),
        createRouteContext("7")
      );
      const payload = await expectJsonSuccess<{ deleted: boolean }>(response, 200);

      expect(payload.deleted).toBe(true);
      expect(deleteShoeMock).toHaveBeenCalledWith({
        userId: 44,
        shoeId: 7,
      });
    });
  });
});
