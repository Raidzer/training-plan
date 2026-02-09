import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAdminSession,
  createJsonRequest,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";

const {
  authMock,
  isValidDateStringMock,
  getPersonalRecordsMock,
  upsertPersonalRecordsMock,
  getUserByIdMock,
} = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    isValidDateStringMock: vi.fn(),
    getPersonalRecordsMock: vi.fn(),
    upsertPersonalRecordsMock: vi.fn(),
    getUserByIdMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("@/server/diary", () => {
  return {
    isValidDateString: isValidDateStringMock,
  };
});

vi.mock("@/server/personalRecords", () => {
  return {
    getPersonalRecords: getPersonalRecordsMock,
    upsertPersonalRecords: upsertPersonalRecordsMock,
  };
});

vi.mock("@/server/services/users", () => {
  return {
    getUserById: getUserByIdMock,
  };
});

import { GET, POST } from "@/app/api/admin/users/[userId]/records/route";

function createRouteContext(userId: string) {
  return {
    params: Promise.resolve({ userId }),
  };
}

describe("API /api/admin/users/[userId]/records route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createAdminSession({ id: "9" }));
    isValidDateStringMock.mockReturnValue(true);
    getUserByIdMock.mockResolvedValue({ id: 12 });
    getPersonalRecordsMock.mockResolvedValue([
      {
        distanceKey: "5k",
        timeText: "00:17:40",
        recordDate: "2026-01-20",
        protocolUrl: null,
        raceName: null,
        raceCity: null,
      },
      {
        distanceKey: "10k",
        timeText: "00:36:20",
        recordDate: "2026-01-10",
        protocolUrl: null,
        raceName: null,
        raceCity: null,
      },
    ]);
    upsertPersonalRecordsMock.mockResolvedValue(undefined);
  });

  describe("GET", () => {
    it("должен возвращать 403 без сессии", async () => {
      authMock.mockResolvedValue(null);

      const response = await GET(new Request("http://localhost"), createRouteContext("12"));

      await expectJsonError(response, 403, "forbidden");
    });

    it("должен возвращать 403 при сессии не-админа", async () => {
      authMock.mockResolvedValue(createSession({ id: "9", role: "athlete" }));

      const response = await GET(new Request("http://localhost"), createRouteContext("12"));

      await expectJsonError(response, 403, "forbidden");
    });

    it("должен возвращать 400 при невалидном id пользователя", async () => {
      const response = await GET(new Request("http://localhost"), createRouteContext("bad"));

      await expectJsonError(response, 400, "invalid_user_id");
    });

    it("должен возвращать отсортированные записи", async () => {
      const response = await GET(new Request("http://localhost"), createRouteContext("12"));
      const payload = await expectJsonSuccess<{
        records: Array<{ distanceKey: string }>;
      }>(response, 200);

      expect(payload.records.map((record) => record.distanceKey)).toEqual(["10k", "5k"]);
      expect(getPersonalRecordsMock).toHaveBeenCalledWith({ userId: 12 });
    });
  });

  describe("POST", () => {
    it("должен возвращать 403 при сессии не-админа", async () => {
      authMock.mockResolvedValue(createSession({ id: "9", role: "athlete" }));
      const request = createJsonRequest({
        url: "http://localhost/api/admin/users/12/records",
        body: { records: [] },
      });

      const response = await POST(request, createRouteContext("12"));

      await expectJsonError(response, 403, "forbidden");
    });

    it("должен возвращать 404 когда целевой пользователь отсутствует", async () => {
      getUserByIdMock.mockResolvedValue(null);
      const request = createJsonRequest({
        url: "http://localhost/api/admin/users/12/records",
        body: {
          records: [{ distanceKey: "10k", timeText: "00:36:20", recordDate: "2026-01-10" }],
        },
      });

      const response = await POST(request, createRouteContext("12"));

      await expectJsonError(response, 404, "not_found");
    });

    it("должен возвращать 400 при невалидном ключе distance", async () => {
      const request = createJsonRequest({
        url: "http://localhost/api/admin/users/12/records",
        body: {
          records: [{ distanceKey: "42k", timeText: "00:36:20", recordDate: "2026-01-10" }],
        },
      });

      const response = await POST(request, createRouteContext("12"));

      await expectJsonError(response, 400, "invalid_distance");
    });

    it("должен возвращать 400 при невалидной дате", async () => {
      isValidDateStringMock.mockReturnValue(false);
      const request = createJsonRequest({
        url: "http://localhost/api/admin/users/12/records",
        body: {
          records: [{ distanceKey: "10k", timeText: "00:36:20", recordDate: "bad" }],
        },
      });

      const response = await POST(request, createRouteContext("12"));

      await expectJsonError(response, 400, "invalid_date");
    });

    it("должен нормализовать пейлоад и возвращать отсортированные записи", async () => {
      const request = createJsonRequest({
        url: "http://localhost/api/admin/users/12/records",
        body: {
          records: [
            {
              distanceKey: "5k",
              timeText: " 00:17,40 ",
              recordDate: " 2026-01-20 ",
              protocolUrl: "  https://example.com/protocol ",
              raceName: "  City Run ",
              raceCity: "  Berlin ",
            },
            {
              distanceKey: "10k",
              timeText: "00:36:20",
              recordDate: "2026-01-10",
            },
          ],
        },
      });

      const response = await POST(request, createRouteContext("12"));
      const payload = await expectJsonSuccess<{
        records: Array<{ distanceKey: string; timeText: string }>;
      }>(response, 200);

      expect(upsertPersonalRecordsMock).toHaveBeenCalledWith({
        userId: 12,
        records: [
          {
            distanceKey: "5k",
            timeText: "00:17.40",
            recordDate: "2026-01-20",
            protocolUrl: "https://example.com/protocol",
            raceName: "City Run",
            raceCity: "Berlin",
          },
          {
            distanceKey: "10k",
            timeText: "00:36:20",
            recordDate: "2026-01-10",
            protocolUrl: null,
            raceName: null,
            raceCity: null,
          },
        ],
      });
      expect(payload.records.map((record) => record.distanceKey)).toEqual(["10k", "5k"]);
    });
  });
});
