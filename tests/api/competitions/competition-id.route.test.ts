import { beforeEach, describe, expect, it, vi } from "vitest";
import { COMPETITION_PRIORITIES } from "@/shared/constants/competitions";
import {
  createJsonRequest,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";

const { authMock, updateCompetitionMock, deleteCompetitionMock } = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    updateCompetitionMock: vi.fn(),
    deleteCompetitionMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("@/server/competitions", () => {
  return {
    updateCompetition: updateCompetitionMock,
    deleteCompetition: deleteCompetitionMock,
  };
});

import { DELETE, PATCH } from "@/app/api/competitions/[competitionId]/route";

function createRouteContext(competitionId: string) {
  return {
    params: Promise.resolve({ competitionId }),
  };
}

describe("API /api/competitions/[competitionId] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "13" }));
    updateCompetitionMock.mockResolvedValue({
      id: 5,
      blockId: 7,
      date: "2026-05-10",
      nameLocation: "Москва",
      distanceMeters: 10000,
      distanceLabel: "10 км",
      priority: COMPETITION_PRIORITIES.REGULAR,
      result: "39:30",
    });
    deleteCompetitionMock.mockResolvedValue(true);
  });

  it("PATCH должен возвращать 400 при невалидном id соревнования", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/competitions/bad",
      method: "PATCH",
      body: { result: "39:30" },
    });

    const response = await PATCH(request, createRouteContext("bad"));

    await expectJsonError(response, 400, "invalid_competition_id");
    expect(updateCompetitionMock).not.toHaveBeenCalled();
  });

  it("PATCH должен возвращать 400 при пустом обновлении", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/competitions/5",
      method: "PATCH",
      body: {},
    });

    const response = await PATCH(request, createRouteContext("5"));

    await expectJsonError(response, 400, "empty_update");
    expect(updateCompetitionMock).not.toHaveBeenCalled();
  });

  it("PATCH должен обновлять соревнование с нормализованными полями", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/competitions/5",
      method: "PATCH",
      body: {
        date: "2026-05-10",
        nameLocation: "  Москва  ",
        distanceLabel: "10 км",
        priority: COMPETITION_PRIORITIES.REGULAR,
        result: " 39:30 ",
      },
    });

    const response = await PATCH(request, createRouteContext("5"));
    await expectJsonSuccess(response, 200);

    expect(updateCompetitionMock).toHaveBeenCalledWith({
      userId: 13,
      competitionId: 5,
      date: "2026-05-10",
      nameLocation: "Москва",
      distanceMeters: 10000,
      distanceLabel: "10 км",
      priority: COMPETITION_PRIORITIES.REGULAR,
      result: "39:30",
    });
  });

  it("PATCH должен возвращать 404 когда соревнование не найдено", async () => {
    updateCompetitionMock.mockResolvedValue(null);
    const request = createJsonRequest({
      url: "http://localhost/api/competitions/5",
      method: "PATCH",
      body: { result: "39:30" },
    });

    const response = await PATCH(request, createRouteContext("5"));

    await expectJsonError(response, 404, "not_found");
  });

  it("DELETE должен удалять соревнование текущего пользователя", async () => {
    const response = await DELETE(
      createJsonRequest({
        url: "http://localhost/api/competitions/5",
        method: "DELETE",
        body: {},
      }),
      createRouteContext("5")
    );
    const payload = await expectJsonSuccess<{ deleted: boolean }>(response, 200);

    expect(payload.deleted).toBe(true);
    expect(deleteCompetitionMock).toHaveBeenCalledWith({
      userId: 13,
      competitionId: 5,
    });
  });

  it("DELETE должен возвращать 404 когда соревнование не найдено", async () => {
    deleteCompetitionMock.mockResolvedValue(false);

    const response = await DELETE(
      createJsonRequest({
        url: "http://localhost/api/competitions/5",
        method: "DELETE",
        body: {},
      }),
      createRouteContext("5")
    );

    await expectJsonError(response, 404, "not_found");
  });
});
