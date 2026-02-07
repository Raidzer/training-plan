import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createJsonRequest,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";
import {
  MAX_PROTOCOL_URL_LENGTH,
  MAX_RACE_CITY_LENGTH,
  MAX_RACE_NAME_LENGTH,
} from "@/shared/constants/personalRecords.constants";

const { authMock, isValidDateStringMock, getPersonalRecordsMock, upsertPersonalRecordsMock } =
  vi.hoisted(() => {
    return {
      authMock: vi.fn(),
      isValidDateStringMock: vi.fn(),
      getPersonalRecordsMock: vi.fn(),
      upsertPersonalRecordsMock: vi.fn(),
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

import { GET, POST } from "@/app/api/personal-records/route";

describe("API /api/personal-records route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "9" }));
    isValidDateStringMock.mockReturnValue(true);
    getPersonalRecordsMock.mockResolvedValue([
      {
        distanceKey: "5k",
        timeText: "00:18:00",
        recordDate: "2026-01-01",
        protocolUrl: null,
        raceName: null,
        raceCity: null,
      },
      {
        distanceKey: "10k",
        timeText: "00:37:00",
        recordDate: "2026-01-01",
        protocolUrl: null,
        raceName: null,
        raceCity: null,
      },
    ]);
    upsertPersonalRecordsMock.mockResolvedValue(undefined);
  });

  describe("GET", () => {
    it("should return 401 without session", async () => {
      authMock.mockResolvedValue(null);

      const response = await GET();

      await expectJsonError(response, 401, "unauthorized");
      expect(getPersonalRecordsMock).not.toHaveBeenCalled();
    });

    it("should return 401 for invalid user id", async () => {
      authMock.mockResolvedValue(createSession({ id: "bad-id" }));

      const response = await GET();

      await expectJsonError(response, 401, "unauthorized");
      expect(getPersonalRecordsMock).not.toHaveBeenCalled();
    });

    it("should return records sorted by distance order", async () => {
      const response = await GET();
      const payload = await expectJsonSuccess<{
        records: Array<{ distanceKey: string; timeText: string }>;
      }>(response, 200);

      expect(payload.records.map((record) => record.distanceKey)).toEqual(["10k", "5k"]);
      expect(getPersonalRecordsMock).toHaveBeenCalledWith({ userId: 9 });
    });
  });

  describe("POST", () => {
    it("should return 401 without session", async () => {
      authMock.mockResolvedValue(null);

      const response = await POST(
        createJsonRequest({
          url: "http://localhost/api/personal-records",
          body: { records: [] },
        })
      );

      await expectJsonError(response, 401, "unauthorized");
    });

    it("should return 401 for invalid user id", async () => {
      authMock.mockResolvedValue(createSession({ id: "bad-id" }));

      const response = await POST(
        createJsonRequest({
          url: "http://localhost/api/personal-records",
          body: { records: [] },
        })
      );

      await expectJsonError(response, 401, "unauthorized");
    });

    it("should return 400 for empty records payload", async () => {
      const response = await POST(
        createJsonRequest({
          url: "http://localhost/api/personal-records",
          body: {},
        })
      );

      await expectJsonError(response, 400, "empty_records");
      expect(upsertPersonalRecordsMock).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid distance key", async () => {
      const response = await POST(
        createJsonRequest({
          url: "http://localhost/api/personal-records",
          body: {
            records: [{ distanceKey: "42k", timeText: "00:18:10", recordDate: "2026-01-01" }],
          },
        })
      );

      await expectJsonError(response, 400, "invalid_distance");
      expect(upsertPersonalRecordsMock).not.toHaveBeenCalled();
    });

    it("should return 400 for duplicate distance keys", async () => {
      const response = await POST(
        createJsonRequest({
          url: "http://localhost/api/personal-records",
          body: {
            records: [
              { distanceKey: "10k", timeText: "00:36:10", recordDate: "2026-01-01" },
              { distanceKey: "10k", timeText: "00:36:20", recordDate: "2026-01-02" },
            ],
          },
        })
      );

      await expectJsonError(response, 400, "duplicate_distance");
      expect(upsertPersonalRecordsMock).not.toHaveBeenCalled();
    });

    it("should normalize empty time as delete operation", async () => {
      const response = await POST(
        createJsonRequest({
          url: "http://localhost/api/personal-records",
          body: {
            records: [
              {
                distanceKey: "10k",
                timeText: "   ",
                recordDate: "2026-01-01",
                protocolUrl: "https://example.com/protocol",
                raceName: "Race",
                raceCity: "City",
              },
            ],
          },
        })
      );

      await expectJsonSuccess<{ records: unknown[] }>(response, 200);
      expect(upsertPersonalRecordsMock).toHaveBeenCalledWith({
        userId: 9,
        records: [
          {
            distanceKey: "10k",
            timeText: "",
            recordDate: null,
            protocolUrl: null,
            raceName: null,
            raceCity: null,
          },
        ],
      });
    });

    it("should return 400 for invalid time format", async () => {
      const response = await POST(
        createJsonRequest({
          url: "http://localhost/api/personal-records",
          body: {
            records: [{ distanceKey: "10k", timeText: "not-time", recordDate: "2026-01-01" }],
          },
        })
      );

      await expectJsonError(response, 400, "invalid_time");
      expect(upsertPersonalRecordsMock).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid date", async () => {
      isValidDateStringMock.mockReturnValue(false);

      const response = await POST(
        createJsonRequest({
          url: "http://localhost/api/personal-records",
          body: {
            records: [{ distanceKey: "10k", timeText: "00:36:20", recordDate: "bad-date" }],
          },
        })
      );

      await expectJsonError(response, 400, "invalid_date");
      expect(upsertPersonalRecordsMock).not.toHaveBeenCalled();
    });

    it("should return 400 for too long protocol url", async () => {
      const response = await POST(
        createJsonRequest({
          url: "http://localhost/api/personal-records",
          body: {
            records: [
              {
                distanceKey: "10k",
                timeText: "00:36:20",
                recordDate: "2026-01-01",
                protocolUrl: "x".repeat(MAX_PROTOCOL_URL_LENGTH + 1),
              },
            ],
          },
        })
      );

      await expectJsonError(response, 400, "invalid_protocol_url");
      expect(upsertPersonalRecordsMock).not.toHaveBeenCalled();
    });

    it("should return 400 for too long race name", async () => {
      const response = await POST(
        createJsonRequest({
          url: "http://localhost/api/personal-records",
          body: {
            records: [
              {
                distanceKey: "10k",
                timeText: "00:36:20",
                recordDate: "2026-01-01",
                raceName: "x".repeat(MAX_RACE_NAME_LENGTH + 1),
              },
            ],
          },
        })
      );

      await expectJsonError(response, 400, "invalid_race_name");
      expect(upsertPersonalRecordsMock).not.toHaveBeenCalled();
    });

    it("should return 400 for too long race city", async () => {
      const response = await POST(
        createJsonRequest({
          url: "http://localhost/api/personal-records",
          body: {
            records: [
              {
                distanceKey: "10k",
                timeText: "00:36:20",
                recordDate: "2026-01-01",
                raceCity: "x".repeat(MAX_RACE_CITY_LENGTH + 1),
              },
            ],
          },
        })
      );

      await expectJsonError(response, 400, "invalid_race_city");
      expect(upsertPersonalRecordsMock).not.toHaveBeenCalled();
    });

    it("should normalize payload, persist and return sorted records", async () => {
      getPersonalRecordsMock.mockResolvedValue([
        {
          distanceKey: "5k",
          timeText: "00:17.35",
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
      ]);

      const response = await POST(
        createJsonRequest({
          url: "http://localhost/api/personal-records",
          body: {
            records: [
              {
                distanceKey: "5k",
                timeText: " 00:17,35 ",
                recordDate: " 2026-01-20 ",
                protocolUrl: "  https://example.com/protocol  ",
                raceName: "  City Run ",
                raceCity: "  Berlin ",
              },
              {
                distanceKey: "10k",
                timeText: "00:36:20",
                recordDate: "2026-01-10",
                protocolUrl: "",
                raceName: "",
                raceCity: "",
              },
            ],
          },
        })
      );
      const payload = await expectJsonSuccess<{
        records: Array<{ distanceKey: string; timeText: string }>;
      }>(response, 200);

      expect(upsertPersonalRecordsMock).toHaveBeenCalledWith({
        userId: 9,
        records: [
          {
            distanceKey: "5k",
            timeText: "00:17.35",
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
