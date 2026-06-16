import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createJsonRequest,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";

const { authMock, updateCompetitionBlockMock, deleteCompetitionBlockMock } = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    updateCompetitionBlockMock: vi.fn(),
    deleteCompetitionBlockMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("@/server/competitions", () => {
  return {
    updateCompetitionBlock: updateCompetitionBlockMock,
    deleteCompetitionBlock: deleteCompetitionBlockMock,
  };
});

import { DELETE, PATCH } from "@/app/api/competition-blocks/[blockId]/route";

function createRouteContext(blockId: string) {
  return {
    params: Promise.resolve({ blockId }),
  };
}

describe("API /api/competition-blocks/[blockId] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "13" }));
    updateCompetitionBlockMock.mockResolvedValue({
      id: 7,
      title: "Весна",
      startDate: "2026-03-01",
      endDate: "2026-06-01",
      competitions: [],
    });
    deleteCompetitionBlockMock.mockResolvedValue(true);
  });

  it("PATCH должен возвращать 400 при невалидном id", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/competition-blocks/bad",
      method: "PATCH",
      body: { title: "Весна" },
    });

    const response = await PATCH(request, createRouteContext("bad"));

    await expectJsonError(response, 400, "invalid_block_id");
    expect(updateCompetitionBlockMock).not.toHaveBeenCalled();
  });

  it("PATCH должен возвращать 400 при пустом обновлении", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/competition-blocks/7",
      method: "PATCH",
      body: {},
    });

    const response = await PATCH(request, createRouteContext("7"));

    await expectJsonError(response, 400, "empty_update");
    expect(updateCompetitionBlockMock).not.toHaveBeenCalled();
  });

  it("PATCH должен обновлять блок текущего пользователя", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/competition-blocks/7",
      method: "PATCH",
      body: {
        title: "  Весна  ",
        startDate: "2026-03-01",
        endDate: "2026-06-01",
      },
    });

    const response = await PATCH(request, createRouteContext("7"));
    await expectJsonSuccess(response, 200);

    expect(updateCompetitionBlockMock).toHaveBeenCalledWith({
      userId: 13,
      blockId: 7,
      title: "Весна",
      startDate: "2026-03-01",
      endDate: "2026-06-01",
    });
  });

  it("PATCH должен возвращать 404 когда блок не найден", async () => {
    updateCompetitionBlockMock.mockResolvedValue(null);
    const request = createJsonRequest({
      url: "http://localhost/api/competition-blocks/7",
      method: "PATCH",
      body: { title: "Весна" },
    });

    const response = await PATCH(request, createRouteContext("7"));

    await expectJsonError(response, 404, "not_found");
  });

  it("DELETE должен удалять блок текущего пользователя", async () => {
    const response = await DELETE(
      createJsonRequest({
        url: "http://localhost/api/competition-blocks/7",
        method: "DELETE",
        body: {},
      }),
      createRouteContext("7")
    );
    const payload = await expectJsonSuccess<{ deleted: boolean }>(response, 200);

    expect(payload.deleted).toBe(true);
    expect(deleteCompetitionBlockMock).toHaveBeenCalledWith({
      userId: 13,
      blockId: 7,
    });
  });

  it("DELETE должен возвращать 404 когда блок не найден", async () => {
    deleteCompetitionBlockMock.mockResolvedValue(false);

    const response = await DELETE(
      createJsonRequest({
        url: "http://localhost/api/competition-blocks/7",
        method: "DELETE",
        body: {},
      }),
      createRouteContext("7")
    );

    await expectJsonError(response, 404, "not_found");
  });
});
