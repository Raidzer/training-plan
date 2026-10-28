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

const {
  authMock,
  isValidDateStringMock,
  getPersonalRecordsMock,
  upsertPersonalRecordsMock,
  improvePersonalRecordMock,
} = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    isValidDateStringMock: vi.fn(),
    getPersonalRecordsMock: vi.fn(),
    upsertPersonalRecordsMock: vi.fn(),
    improvePersonalRecordMock: vi.fn(),
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
    improvePersonalRecord: improvePersonalRecordMock,
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
    improvePersonalRecordMock.mockResolvedValue("updated");
  });

  describe("GET", () => {
    it("должен возвращать 401 без сессии", async () => {
      authMock.mockResolvedValue(null);

      const response = await GET();

      await expectJsonError(response, 401, "unauthorized");
      expect(getPersonalRecordsMock).not.toHaveBeenCalled();
    });

    it("должен возвращать 401 при невалидном id пользователя", async () => {
      authMock.mockResolvedValue(createSession({ id: "bad-id" }));

      const response = await GET();

      await expectJsonError(response, 401, "unauthorized");
      expect(getPersonalRecordsMock).not.toHaveBeenCalled();
    });

    it("должен возвращать записи отсортированные по порядку дистанции", async () => {
      const response = await GET();
      const payload = await expectJsonSuccess<{
        records: Array<{ distanceKey: string; timeText: string }>;
      }>(response, 200);

      expect(payload.records.map((record) => record.distanceKey)).toEqual(["10k", "5k"]);
      expect(getPersonalRecordsMock).toHaveBeenCalledWith({ userId: 9 });
    });
  });

  describe("POST", () => {
    it("должен возвращать 401 без сессии", async () => {
      authMock.mockResolvedValue(null);

      const response = await POST(
        createJsonRequest({
          url: "http://localhost/api/personal-records",
          body: { records: [] },
        })
      );

      await expectJsonError(response, 401, "unauthorized");
    });

    it("должен возвращать 401 при невалидном id пользователя", async () => {
      authMock.mockResolvedValue(createSession({ id: "bad-id" }));

      const response = await POST(
        createJsonRequest({
          url: "http://localhost/api/personal-records",
          body: { records: [] },
        })
      );

      await expectJsonError(response, 401, "unauthorized");
    });

    it("должен возвращать 400 при пустом пейлоаде записей", async () => {
      const response = await POST(
        createJsonRequest({
          url: "http://localhost/api/personal-records",
          body: {},
        })
      );

      await expectJsonError(response, 400, "empty_records");
      expect(upsertPersonalRecordsMock).not.toHaveBeenCalled();
    });

    it("должен возвращать 400 при невалидном ключе distance", async () => {
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

    it("должен возвращать 400 при дублирующихся ключах distance", async () => {
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

    it("должен нормализовать пустое время как операцию удаления", async () => {
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

    it("должен возвращать 400 при невалидном формате времени", async () => {
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

    it("должен возвращать 400 при невалидной дате", async () => {
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

    it("должен возвращать 400 при слишком длинном protocol URL", async () => {
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

    it("должен возвращать 400 при слишком длинном названии забега", async () => {
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

    it("должен возвращать 400 при слишком длинном городе забега", async () => {
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

    it("должен нормализовать пейлоад, сохранять и возвращать отсортированные записи", async () => {
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

  describe("POST onlyIfBetter", () => {
    const record = {
      distanceKey: "10k",
      timeText: "39:30,1",
      recordDate: "2026-10-28",
      raceName: "Старт",
    };

    const postImprovement = (body: unknown) =>
      POST(
        createJsonRequest({
          url: "http://localhost/api/personal-records",
          body,
        })
      );

    it("сохраняет только один улучшенный рекорд, нормализуя время", async () => {
      const response = await postImprovement({ onlyIfBetter: true, records: [record] });

      expect(await response.json()).toEqual({ status: "updated" });
      expect(response.status).toBe(200);
      expect(improvePersonalRecordMock).toHaveBeenCalledWith({
        userId: 9,
        record: {
          ...record,
          timeText: "00:39:30.10",
          protocolUrl: null,
          raceCity: null,
        },
      });
      expect(upsertPersonalRecordsMock).not.toHaveBeenCalled();
    });

    it.each(["not_better", "conflict"])(
      "возвращает результат %s без безусловной записи",
      async (status) => {
        improvePersonalRecordMock.mockResolvedValue(status);

        const response = await postImprovement({ onlyIfBetter: true, records: [record] });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ status });
        expect(upsertPersonalRecordsMock).not.toHaveBeenCalled();
      }
    );

    it("сообщает о нераспознаваемом существующем рекорде", async () => {
      improvePersonalRecordMock.mockResolvedValue("invalid_current_record");

      const response = await postImprovement({ onlyIfBetter: true, records: [record] });

      await expectJsonError(response, 409, "invalid_current_record");
      expect(upsertPersonalRecordsMock).not.toHaveBeenCalled();
    });

    it.each(["true", 1, null, {}])("отклоняет неверный тип режима %j", async (onlyIfBetter) => {
      const response = await postImprovement({ onlyIfBetter, records: [record] });

      await expectJsonError(response, 400, "invalid_mode");
      expect(improvePersonalRecordMock).not.toHaveBeenCalled();
      expect(upsertPersonalRecordsMock).not.toHaveBeenCalled();
    });

    it.each(["", "00:00", "99:99", "DNF"])(
      "отклоняет пустое, нулевое и невалидное время %s",
      async (timeText) => {
        const response = await postImprovement({
          onlyIfBetter: true,
          records: [{ ...record, timeText }],
        });

        await expectJsonError(response, 400, "invalid_time");
        expect(improvePersonalRecordMock).not.toHaveBeenCalled();
        expect(upsertPersonalRecordsMock).not.toHaveBeenCalled();
      }
    );

    it("не разрешает отправить несколько рекордов в режиме улучшения", async () => {
      const response = await postImprovement({
        onlyIfBetter: true,
        records: [record, { ...record, distanceKey: "5k" }],
      });

      await expectJsonError(response, 400, "single_record_required");
      expect(improvePersonalRecordMock).not.toHaveBeenCalled();
      expect(upsertPersonalRecordsMock).not.toHaveBeenCalled();
    });

    it("проверяет авторизацию до условной записи", async () => {
      authMock.mockResolvedValue(null);

      const response = await postImprovement({ onlyIfBetter: true, records: [record] });

      await expectJsonError(response, 401, "unauthorized");
      expect(improvePersonalRecordMock).not.toHaveBeenCalled();
    });

    it("проверяет дату и метаданные до условной записи", async () => {
      isValidDateStringMock.mockReturnValue(false);

      const response = await postImprovement({ onlyIfBetter: true, records: [record] });

      await expectJsonError(response, 400, "invalid_date");
      expect(improvePersonalRecordMock).not.toHaveBeenCalled();
    });

    it("сохраняет прежний режим при явно указанном false", async () => {
      const response = await postImprovement({ onlyIfBetter: false, records: [record] });

      await expectJsonSuccess(response, 200);
      expect(upsertPersonalRecordsMock).toHaveBeenCalledOnce();
      expect(improvePersonalRecordMock).not.toHaveBeenCalled();
    });
  });
});
