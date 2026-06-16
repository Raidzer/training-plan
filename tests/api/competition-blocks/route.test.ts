import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createJsonRequest,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";

const { authMock, listCompetitionBlocksByUserMock, createCompetitionBlockMock } = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    listCompetitionBlocksByUserMock: vi.fn(),
    createCompetitionBlockMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("@/server/competitions", () => {
  return {
    listCompetitionBlocksByUser: listCompetitionBlocksByUserMock,
    createCompetitionBlock: createCompetitionBlockMock,
  };
});

import { GET, POST } from "@/app/api/competition-blocks/route";

describe("API /api/competition-blocks route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "13" }));
    listCompetitionBlocksByUserMock.mockResolvedValue([
      {
        id: 1,
        title: "Весна",
        startDate: "2026-03-01",
        endDate: "2026-06-01",
        competitions: [],
      },
    ]);
    createCompetitionBlockMock.mockResolvedValue({
      id: 2,
      title: "Осень",
      startDate: "2026-08-01",
      endDate: "2026-11-01",
      competitions: [],
    });
  });

  it("GET должен возвращать 401 без сессии", async () => {
    authMock.mockResolvedValue(null);

    const response = await GET();

    await expectJsonError(response, 401, "unauthorized");
    expect(listCompetitionBlocksByUserMock).not.toHaveBeenCalled();
  });

  it("GET должен возвращать блоки текущего пользователя", async () => {
    const response = await GET();
    const payload = await expectJsonSuccess<{ blocks: Array<{ title: string }> }>(response, 200);

    expect(payload.blocks[0].title).toBe("Весна");
    expect(listCompetitionBlocksByUserMock).toHaveBeenCalledWith(13);
  });

  it("POST должен валидировать название", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/competition-blocks",
      body: {
        title: " ",
        startDate: "2026-03-01",
        endDate: "2026-06-01",
      },
    });

    const response = await POST(request);

    await expectJsonError(response, 400, "invalid_title");
    expect(createCompetitionBlockMock).not.toHaveBeenCalled();
  });

  it("POST должен валидировать период", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/competition-blocks",
      body: {
        title: "Весна",
        startDate: "2026-06-01",
        endDate: "2026-03-01",
      },
    });

    const response = await POST(request);

    await expectJsonError(response, 400, "invalid_period");
    expect(createCompetitionBlockMock).not.toHaveBeenCalled();
  });

  it("POST должен создавать блок с обрезанными строками", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/competition-blocks",
      body: {
        title: "  Осень  ",
        startDate: "2026-08-01",
        endDate: "2026-11-01",
      },
    });

    const response = await POST(request);
    const payload = await expectJsonSuccess<{ block: { title: string } }>(response, 201);

    expect(payload.block.title).toBe("Осень");
    expect(createCompetitionBlockMock).toHaveBeenCalledWith({
      userId: 13,
      title: "Осень",
      startDate: "2026-08-01",
      endDate: "2026-11-01",
    });
  });
});
