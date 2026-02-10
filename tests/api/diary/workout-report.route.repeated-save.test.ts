import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJsonRequest, createSession, expectJsonSuccess } from "@tests/helpers";

const {
  authMock,
  isValidDateStringMock,
  getPlanEntrySummaryForUserMock,
  areShoesOwnedByUserMock,
  upsertWorkoutReportMock,
} = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    isValidDateStringMock: vi.fn(),
    getPlanEntrySummaryForUserMock: vi.fn(),
    areShoesOwnedByUserMock: vi.fn(),
    upsertWorkoutReportMock: vi.fn(),
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

vi.mock("@/server/workoutReports", () => {
  return {
    getPlanEntrySummaryForUser: getPlanEntrySummaryForUserMock,
    areShoesOwnedByUser: areShoesOwnedByUserMock,
    upsertWorkoutReport: upsertWorkoutReportMock,
  };
});

import { POST } from "@/app/api/diary/workout-report/route";

function createPayload(resultText: string) {
  return {
    planEntryId: 100,
    date: "2026-01-03",
    startTime: "08:30",
    resultText,
    commentText: "comment",
  };
}

describe("POST /api/diary/workout-report (repeat save)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "15" }));
    isValidDateStringMock.mockReturnValue(true);
    getPlanEntrySummaryForUserMock.mockResolvedValue({
      id: 100,
      date: "2026-01-03",
    });
    areShoesOwnedByUserMock.mockResolvedValue(true);
    upsertWorkoutReportMock.mockResolvedValue(undefined);
  });

  it("should pass new resultText on repeated saves for same planEntryId", async () => {
    const firstRequest = createJsonRequest({
      url: "http://localhost/api/diary/workout-report",
      body: createPayload("first result"),
    });
    const secondRequest = createJsonRequest({
      url: "http://localhost/api/diary/workout-report",
      body: createPayload("second result"),
    });

    const firstResponse = await POST(firstRequest);
    const secondResponse = await POST(secondRequest);
    await expectJsonSuccess<{ ok: boolean }>(firstResponse, 200);
    await expectJsonSuccess<{ ok: boolean }>(secondResponse, 200);

    expect(upsertWorkoutReportMock).toHaveBeenCalledTimes(2);
    expect(upsertWorkoutReportMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        planEntryId: 100,
        resultText: "first result",
      })
    );
    expect(upsertWorkoutReportMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        planEntryId: 100,
        resultText: "second result",
      })
    );
  });
});
