import { beforeEach, describe, expect, it, vi } from "vitest";
import { COMPETITION_PRIORITIES } from "@/shared/constants/competitions";
import {
  createJsonRequest,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";

const { authMock, createCompetitionMock } = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    createCompetitionMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("@/server/competitions", () => {
  return {
    createCompetition: createCompetitionMock,
  };
});

import { POST } from "@/app/api/competition-blocks/[blockId]/competitions/route";

function createRouteContext(blockId: string) {
  return {
    params: Promise.resolve({ blockId }),
  };
}

describe("API /api/competition-blocks/[blockId]/competitions route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "13" }));
    createCompetitionMock.mockResolvedValue({
      id: 5,
      blockId: 7,
      date: "2026-05-10",
      nameLocation: "Москва",
      distanceMeters: 10000,
      distanceLabel: "10 км",
      priority: COMPETITION_PRIORITIES.MAIN,
      result: null,
    });
  });

  it("POST должен возвращать 401 без сессии", async () => {
    authMock.mockResolvedValue(null);
    const request = createJsonRequest({
      url: "http://localhost/api/competition-blocks/7/competitions",
      body: {},
    });

    const response = await POST(request, createRouteContext("7"));

    await expectJsonError(response, 401, "unauthorized");
  });

  it("POST должен валидировать id блока", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/competition-blocks/bad/competitions",
      body: {},
    });

    const response = await POST(request, createRouteContext("bad"));

    await expectJsonError(response, 400, "invalid_block_id");
    expect(createCompetitionMock).not.toHaveBeenCalled();
  });

  it("POST должен валидировать обязательные поля", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/competition-blocks/7/competitions",
      body: {
        date: "bad-date",
      },
    });

    const response = await POST(request, createRouteContext("7"));

    await expectJsonError(response, 400, "invalid_date");
    expect(createCompetitionMock).not.toHaveBeenCalled();
  });

  it("POST должен создавать соревнование с нормализованными данными", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/competition-blocks/7/competitions",
      body: {
        date: "2026-05-10",
        nameLocation: "  Москва  ",
        distanceLabel: "  10 км  ",
        priority: COMPETITION_PRIORITIES.MAIN,
        result: " ",
      },
    });

    const response = await POST(request, createRouteContext("7"));
    const payload = await expectJsonSuccess<{ competition: { id: number } }>(response, 201);

    expect(payload.competition.id).toBe(5);
    expect(createCompetitionMock).toHaveBeenCalledWith({
      userId: 13,
      blockId: 7,
      date: "2026-05-10",
      nameLocation: "Москва",
      distanceMeters: 10000,
      distanceLabel: "10 км",
      priority: COMPETITION_PRIORITIES.MAIN,
      result: null,
    });
  });

  it("POST должен возвращать 404 когда блок не найден", async () => {
    createCompetitionMock.mockResolvedValue(null);
    const request = createJsonRequest({
      url: "http://localhost/api/competition-blocks/7/competitions",
      body: {
        date: "2026-05-10",
        nameLocation: "Москва",
        distanceLabel: "10 км",
        priority: COMPETITION_PRIORITIES.REGULAR,
        result: null,
      },
    });

    const response = await POST(request, createRouteContext("7"));

    await expectJsonError(response, 404, "not_found");
  });
});
