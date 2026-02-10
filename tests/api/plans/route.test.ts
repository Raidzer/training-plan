import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createJsonRequest,
  createRequestWithQuery,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";

const {
  authMock,
  getPlanEntriesWithReportFlagsMock,
  upsertPlanEntriesForDateMock,
  deletePlanEntriesForDateMock,
} = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    getPlanEntriesWithReportFlagsMock: vi.fn(),
    upsertPlanEntriesForDateMock: vi.fn(),
    deletePlanEntriesForDateMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("@/server/plans", () => {
  return {
    getPlanEntriesWithReportFlags: getPlanEntriesWithReportFlagsMock,
    upsertPlanEntriesForDate: upsertPlanEntriesForDateMock,
    deletePlanEntriesForDate: deletePlanEntriesForDateMock,
  };
});

import { DELETE, GET, POST } from "@/app/api/plans/route";

describe("API /api/plans route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "22" }));
    getPlanEntriesWithReportFlagsMock.mockResolvedValue([]);
    upsertPlanEntriesForDateMock.mockResolvedValue({ entries: [] });
    deletePlanEntriesForDateMock.mockResolvedValue({ deleted: true });
  });

  describe("GET", () => {
    it("должен возвращать 401 без сессии", async () => {
      authMock.mockResolvedValue(null);

      const response = await GET();

      await expectJsonError(response, 401, "unauthorized");
    });

    it("должен возвращать 401 при некорректном id пользователя", async () => {
      authMock.mockResolvedValue(createSession({ id: "0" }));

      const response = await GET();

      await expectJsonError(response, 401, "unauthorized");
    });

    it("должен отдавать элементы при валидной сессии", async () => {
      getPlanEntriesWithReportFlagsMock.mockResolvedValue([
        {
          id: 1,
          date: "2026-01-01",
          sessionOrder: 1,
          taskText: "Run",
          commentText: null,
          importId: null,
          isWorkload: true,
          hasReport: false,
        },
      ]);

      const response = await GET();

      const payload = await expectJsonSuccess<{
        entries: Array<{ id: number; date: string }>;
      }>(response, 200);
      expect(payload.entries).toHaveLength(1);
      expect(payload.entries[0].date).toBe("2026-01-01");
      expect(getPlanEntriesWithReportFlagsMock).toHaveBeenCalledWith(22, 500);
    });
  });

  describe("POST", () => {
    it("должен возвращать 401 без сессии", async () => {
      authMock.mockResolvedValue(null);
      const request = createJsonRequest({
        url: "http://localhost/api/plans",
        body: {
          date: "2026-01-01",
          entries: [{ taskText: "Run" }],
        },
      });

      const response = await POST(request);
      await expectJsonError(response, 401, "unauthorized");
    });

    it("должен валидировать дату", async () => {
      const request = createJsonRequest({
        url: "http://localhost/api/plans",
        body: {
          date: "bad",
          entries: [{ taskText: "Run" }],
        },
      });

      const response = await POST(request);
      await expectJsonError(response, 400, "invalid_date");
    });

    it("должен валидировать originalDate", async () => {
      const request = createJsonRequest({
        url: "http://localhost/api/plans",
        body: {
          date: "2026-01-01",
          originalDate: "bad",
          entries: [{ taskText: "Run" }],
        },
      });

      const response = await POST(request);
      await expectJsonError(response, 400, "invalid_original_date");
    });

    it("должен валидировать пустой список элементы", async () => {
      const request = createJsonRequest({
        url: "http://localhost/api/plans",
        body: {
          date: "2026-01-01",
          entries: [],
        },
      });

      const response = await POST(request);
      await expectJsonError(response, 400, "empty_entries");
    });

    it("должен валидировать id тренировок", async () => {
      const request = createJsonRequest({
        url: "http://localhost/api/plans",
        body: {
          date: "2026-01-01",
          entries: [
            { id: 1, taskText: "Run 1" },
            { id: 1, taskText: "Run 2" },
          ],
        },
      });

      const response = await POST(request);
      await expectJsonError(response, 400, "invalid_entry_id");
    });

    it("должен валидировать пустой taskText", async () => {
      const request = createJsonRequest({
        url: "http://localhost/api/plans",
        body: {
          date: "2026-01-01",
          entries: [{ taskText: "   " }],
        },
      });

      const response = await POST(request);
      await expectJsonError(response, 400, "empty_entries");
    });

    it("должен маппить ошибки серверного слоя", async () => {
      upsertPlanEntriesForDateMock.mockResolvedValueOnce({ error: "date_exists" });
      upsertPlanEntriesForDateMock.mockResolvedValueOnce({ error: "not_found" });
      upsertPlanEntriesForDateMock.mockResolvedValueOnce({ error: "invalid_entry_id" });

      const requestBase = {
        url: "http://localhost/api/plans",
        body: {
          date: "2026-01-01",
          entries: [{ taskText: "Run" }],
        },
      };

      const responseDateExists = await POST(createJsonRequest(requestBase));
      await expectJsonError(responseDateExists, 409, "date_exists");

      const responseNotFound = await POST(createJsonRequest(requestBase));
      await expectJsonError(responseNotFound, 404, "not_found");

      const responseInvalidEntry = await POST(createJsonRequest(requestBase));
      await expectJsonError(responseInvalidEntry, 400, "invalid_entry_id");
    });

    it("должен нормализовать пейлоад и вызывать upsertPlanEntriesForDate", async () => {
      upsertPlanEntriesForDateMock.mockResolvedValue({
        entries: [
          {
            id: 5,
            date: "2026-01-10",
            sessionOrder: 1,
            taskText: "A",
            commentText: "note",
            importId: null,
            isWorkload: true,
            hasReport: false,
          },
        ],
      });

      const request = createJsonRequest({
        url: "http://localhost/api/plans",
        body: {
          date: "2026-01-10",
          originalDate: "2026-01-09",
          isWorkload: true,
          entries: [
            { id: "5", taskText: " A ", commentText: " note " },
            { taskText: " B ", commentText: "   " },
          ],
        },
      });

      const response = await POST(request);
      const payload = await expectJsonSuccess<{
        entries: Array<{ id: number; taskText: string }>;
      }>(response, 200);

      expect(payload.entries).toHaveLength(1);
      expect(upsertPlanEntriesForDateMock).toHaveBeenCalledWith({
        userId: 22,
        date: "2026-01-10",
        originalDate: "2026-01-09",
        isWorkload: true,
        isEdit: true,
        entries: [
          { id: 5, taskText: "A", commentText: "note" },
          { id: null, taskText: "B", commentText: null },
        ],
      });
    });
  });

  describe("DELETE", () => {
    it("должен возвращать 401 без сессии", async () => {
      authMock.mockResolvedValue(null);
      const request = createRequestWithQuery({
        path: "/api/plans",
        method: "DELETE",
        query: { date: "2026-01-01" },
      });

      const response = await DELETE(request);
      await expectJsonError(response, 401, "unauthorized");
    });

    it("должен валидировать дата запрашивать", async () => {
      const request = createRequestWithQuery({
        path: "/api/plans",
        method: "DELETE",
        query: { date: "bad" },
      });

      const response = await DELETE(request);
      await expectJsonError(response, 400, "invalid_date");
    });

    it("должен маппить not_found и отдавать удаленный при успехе", async () => {
      deletePlanEntriesForDateMock.mockResolvedValueOnce({ error: "not_found" });
      deletePlanEntriesForDateMock.mockResolvedValueOnce({ deleted: true });

      const request = createRequestWithQuery({
        path: "/api/plans",
        method: "DELETE",
        query: { date: "2026-01-01" },
      });

      const notFoundResponse = await DELETE(request);
      await expectJsonError(notFoundResponse, 404, "not_found");

      const successResponse = await DELETE(request);
      const payload = await expectJsonSuccess<{ deleted: boolean }>(successResponse, 200);
      expect(payload.deleted).toBe(true);
      expect(deletePlanEntriesForDateMock).toHaveBeenCalledWith({
        userId: 22,
        date: "2026-01-01",
      });
    });
  });
});
