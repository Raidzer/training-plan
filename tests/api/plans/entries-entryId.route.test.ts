import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createJsonRequest,
  createSession,
  expectJsonError,
  expectJsonSuccess,
} from "@tests/helpers";

const { authMock, updatePlanEntryTextMock } = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    updatePlanEntryTextMock: vi.fn(),
  };
});

vi.mock("@/auth", () => {
  return {
    auth: authMock,
  };
});

vi.mock("@/server/plans", () => {
  return {
    updatePlanEntryText: updatePlanEntryTextMock,
  };
});

import { PATCH } from "@/app/api/plans/entries/[entryId]/route";

const createContext = (entryId: string) => ({
  params: Promise.resolve({ entryId }),
});

describe("API /api/plans/entries/[entryId] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(createSession({ id: "22" }));
    updatePlanEntryTextMock.mockResolvedValue({ updated: true });
  });

  it("должен возвращать 401 без сессии", async () => {
    authMock.mockResolvedValue(null);
    const request = createJsonRequest({
      url: "http://localhost/api/plans/entries/5",
      method: "PATCH",
      body: {
        taskText: "Run",
      },
    });

    const response = await PATCH(request, createContext("5"));

    await expectJsonError(response, 401, "unauthorized");
  });

  it("должен валидировать id тренировки", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/plans/entries/bad",
      method: "PATCH",
      body: {
        taskText: "Run",
      },
    });

    const response = await PATCH(request, createContext("bad"));

    await expectJsonError(response, 400, "invalid_entry_id");
  });

  it("должен валидировать пустое задание", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/plans/entries/5",
      method: "PATCH",
      body: {
        taskText: "   ",
      },
    });

    const response = await PATCH(request, createContext("5"));

    await expectJsonError(response, 400, "empty_task");
  });

  it("должен нормализовать payload и обновлять текст тренировки", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/plans/entries/5",
      method: "PATCH",
      body: {
        taskText: "  Run  ",
        commentText: "  note  ",
      },
    });

    const response = await PATCH(request, createContext("5"));
    const payload = await expectJsonSuccess<{ updated: boolean }>(response, 200);

    expect(payload.updated).toBe(true);
    expect(updatePlanEntryTextMock).toHaveBeenCalledWith({
      userId: 22,
      entryId: 5,
      taskText: "Run",
      commentText: "note",
    });
  });

  it("должен сохранять пустой комментарий как null", async () => {
    const request = createJsonRequest({
      url: "http://localhost/api/plans/entries/5",
      method: "PATCH",
      body: {
        taskText: "Run",
        commentText: "   ",
      },
    });

    const response = await PATCH(request, createContext("5"));

    await expectJsonSuccess<{ updated: boolean }>(response, 200);
    expect(updatePlanEntryTextMock).toHaveBeenCalledWith({
      userId: 22,
      entryId: 5,
      taskText: "Run",
      commentText: null,
    });
  });

  it("должен маппить not_found", async () => {
    updatePlanEntryTextMock.mockResolvedValue({ error: "not_found" });
    const request = createJsonRequest({
      url: "http://localhost/api/plans/entries/5",
      method: "PATCH",
      body: {
        taskText: "Run",
      },
    });

    const response = await PATCH(request, createContext("5"));

    await expectJsonError(response, 404, "not_found");
  });
});
