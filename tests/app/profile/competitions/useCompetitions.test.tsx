import { act, renderHook, waitFor } from "@testing-library/react";
import dayjs from "dayjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COMPETITION_PRIORITIES } from "@/shared/constants/competitions";
import { useCompetitions } from "@/app/(protected)/profile/competitions/CompetitionsClient/hooks/useCompetitions";
import { competitionsLabels } from "@/app/(protected)/profile/competitions/CompetitionsClient/constants/competitionsConstants";
import type {
  CompetitionBlockItem,
  CompetitionItem,
} from "@/app/(protected)/profile/competitions/CompetitionsClient/types/competitionsTypes";
import type { MessageInstance } from "antd/es/message/interface";
import type { HookAPI as ModalHookAPI } from "antd/es/modal/useModal";

function createMessageApi() {
  return {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  } as unknown as MessageInstance;
}

function createModalApi() {
  return {
    confirm: vi.fn(),
  } as unknown as ModalHookAPI;
}

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

function createCompetition(overrides: Partial<CompetitionItem> = {}): CompetitionItem {
  return {
    id: 10,
    blockId: 1,
    date: "2026-05-10",
    nameLocation: "Москва",
    distanceMeters: 10000,
    distanceLabel: "10 км",
    priority: COMPETITION_PRIORITIES.REGULAR,
    result: null,
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function createBlock(overrides: Partial<CompetitionBlockItem> = {}): CompetitionBlockItem {
  return {
    id: 1,
    title: "Весна",
    startDate: "2026-03-01",
    endDate: "2026-06-01",
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    competitions: [],
    ...overrides,
  };
}

async function renderUseCompetitions(initialBlocks: CompetitionBlockItem[] = []) {
  const fetchMock = vi.fn((input: RequestInfo | URL, _init?: RequestInit) => {
    const url = String(input);
    if (url === "/api/competition-blocks") {
      return Promise.resolve(createJsonResponse({ blocks: initialBlocks }));
    }

    return Promise.resolve(createJsonResponse({}));
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  const messageApi = createMessageApi();
  const modalApi = createModalApi();

  const hook = renderHook(() =>
    useCompetitions({
      messageApi,
      modalApi,
    })
  );

  await waitFor(() => {
    expect(hook.result.current.loading).toBe(false);
  });

  return {
    hook,
    fetchMock,
    messageApi,
    modalApi,
  };
}

describe("useCompetitions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    global.fetch = vi.fn() as unknown as typeof fetch;
  });

  it("должен загружать блоки при монтировании", async () => {
    const block = createBlock();
    const { hook, fetchMock } = await renderUseCompetitions([block]);

    expect(fetchMock).toHaveBeenCalledWith("/api/competition-blocks", {
      cache: "no-store",
    });
    expect(hook.result.current.blocks).toEqual([block]);
  });

  it("должен валидировать создание блока до запроса", async () => {
    const { hook, fetchMock, messageApi } = await renderUseCompetitions();

    act(() => {
      hook.result.current.updateNewBlockForm("title", " ");
    });

    await act(async () => {
      await hook.result.current.handleCreateBlock();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(messageApi.warning).toHaveBeenCalledWith(competitionsLabels.blockTitleRequired);
  });

  it("должен создавать блок и сбрасывать форму", async () => {
    const created = createBlock({ id: 2, title: "Осень" });
    const { hook, fetchMock, messageApi } = await renderUseCompetitions();
    fetchMock.mockResolvedValueOnce(createJsonResponse({ block: created }, 201));

    act(() => {
      hook.result.current.updateNewBlockForm("title", " Осень ");
      hook.result.current.updateNewBlockForm("startDate", dayjs("2026-08-01"));
      hook.result.current.updateNewBlockForm("endDate", dayjs("2026-11-01"));
    });

    await act(async () => {
      await hook.result.current.handleCreateBlock();
    });

    const createRequest = fetchMock.mock.calls[1]?.[1] as RequestInit;

    expect(createRequest.method).toBe("POST");
    expect(JSON.parse(String(createRequest.body))).toEqual({
      title: "Осень",
      startDate: "2026-08-01",
      endDate: "2026-11-01",
    });
    expect(hook.result.current.blocks[0]).toEqual(created);
    expect(hook.result.current.newBlockForm.title).toBe("");
    expect(messageApi.success).toHaveBeenCalledWith(competitionsLabels.blockSaveOk);
  });

  it("должен добавлять соревнование в выбранный блок", async () => {
    const block = createBlock();
    const competition = createCompetition({ blockId: block.id, result: "39:30" });
    const { hook, fetchMock, messageApi } = await renderUseCompetitions([block]);
    fetchMock.mockResolvedValueOnce(createJsonResponse({ competition }, 201));

    act(() => {
      hook.result.current.updateCompetitionForm(block.id, "date", dayjs("2026-05-10"));
      hook.result.current.updateCompetitionForm(block.id, "nameLocation", " Москва ");
      hook.result.current.updateCompetitionForm(block.id, "distanceLabel", "10 км");
      hook.result.current.updateCompetitionForm(
        block.id,
        "priority",
        COMPETITION_PRIORITIES.REGULAR
      );
      hook.result.current.updateCompetitionForm(block.id, "result", "39:30");
    });

    await act(async () => {
      await hook.result.current.handleCreateCompetition(block.id);
    });

    const createRequest = fetchMock.mock.calls[1]?.[1] as RequestInit;

    expect(String(fetchMock.mock.calls[1]?.[0])).toBe("/api/competition-blocks/1/competitions");
    expect(createRequest.method).toBe("POST");
    expect(JSON.parse(String(createRequest.body))).toEqual({
      date: "2026-05-10",
      nameLocation: "Москва",
      distanceLabel: "10 км",
      priority: COMPETITION_PRIORITIES.REGULAR,
      result: "39:30",
    });
    expect(hook.result.current.blocks[0].competitions).toEqual([competition]);
    expect(messageApi.success).toHaveBeenCalledWith(competitionsLabels.competitionSaveOk);
  });
});
