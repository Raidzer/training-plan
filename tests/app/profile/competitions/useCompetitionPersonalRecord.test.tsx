import { act, render, renderHook, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MessageInstance } from "antd/es/message/interface";
import type { ModalFuncProps } from "antd/es/modal/interface";
import type { HookAPI as ModalHookAPI } from "antd/es/modal/useModal";
import { useCompetitionPersonalRecord } from "@/app/(protected)/profile/competitions/CompetitionsClient/hooks/useCompetitionPersonalRecord";
import { personalRecordOfferLabels } from "@/app/(protected)/profile/competitions/CompetitionsClient/constants/personalRecordOfferConstants";
import type { CompetitionItem } from "@/app/(protected)/profile/competitions/CompetitionsClient/types/competitionsTypes";
import { COMPETITION_PRIORITIES } from "@/shared/constants/competitions";
import { PERSONAL_RECORD_DISTANCES } from "@/shared/constants/personalRecords.constants";

function createCompetition(overrides: Partial<CompetitionItem> = {}): CompetitionItem {
  return {
    id: 10,
    blockId: 1,
    date: "2026-05-10",
    nameLocation: "Московский забег",
    distanceMeters: 10000,
    distanceLabel: "10 км",
    priority: COMPETITION_PRIORITIES.REGULAR,
    result: "39:30",
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function setup(records: unknown = []) {
  const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ records }));
  global.fetch = fetchMock as typeof fetch;
  const messageApi = {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  };
  let config: ModalFuncProps = {};
  const dialog = {
    destroy: vi.fn(),
    then: vi.fn().mockResolvedValue(undefined),
    update: vi.fn((update: Partial<ModalFuncProps>) => {
      config = { ...config, ...update };
    }),
  };
  const confirm = vi.fn((nextConfig: ModalFuncProps) => {
    config = nextConfig;
    return dialog;
  });
  const modalApi = { confirm } as unknown as ModalHookAPI;
  const hook = renderHook(() =>
    useCompetitionPersonalRecord({
      messageApi: messageApi as unknown as MessageInstance,
      modalApi,
    })
  );

  return { hook, fetchMock, messageApi, confirm, dialog, getConfig: () => config };
}

describe("useCompetitionPersonalRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(PERSONAL_RECORD_DISTANCES)("предлагает первый рекорд на $label", async (distance) => {
    const { hook, fetchMock, confirm, getConfig } = setup();

    await act(async () => {
      await hook.result.current(createCompetition({ distanceLabel: distance.label }));
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/personal-records", { cache: "no-store" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(getConfig().okText).toBe(personalRecordOfferLabels.saveButton);
    expect(getConfig().cancelText).toBe(personalRecordOfferLabels.skipButton);
  });

  it("показывает данные, перенос и очистку метаданных до подтверждения", async () => {
    const { hook, getConfig } = setup([{ distanceKey: "10k", timeText: "40:00" }]);
    await act(async () => {
      await hook.result.current(createCompetition());
    });
    render(<>{getConfig().content}</>);

    expect(getConfig().title).toBe(personalRecordOfferLabels.title);
    expect(getConfig().okText).toBe(personalRecordOfferLabels.updateButton);
    expect(screen.getByText("10 км")).toBeTruthy();
    expect(screen.getByText("00:40:00")).toBeTruthy();
    expect(screen.getByText("00:39:30")).toBeTruthy();
    expect(screen.getByText("10.05.2026")).toBeTruthy();
    expect(screen.getByText("Московский забег")).toBeTruthy();
    expect(screen.getByText(personalRecordOfferLabels.transferDescription)).toBeTruthy();
  });

  it("сообщает об отсутствии прежнего рекорда", async () => {
    const { hook, getConfig } = setup();
    await hook.result.current(createCompetition());
    render(<>{getConfig().content}</>);
    expect(screen.getByText(personalRecordOfferLabels.noCurrentRecord)).toBeTruthy();
  });

  it.each([null, "", "DNF", "00:00", "60:00", "39:60", "0:39:30"])(
    "не читает рекорды для невалидного результата %s",
    async (result) => {
      const { hook, fetchMock, confirm } = setup();
      await hook.result.current(createCompetition({ result }));
      expect(fetchMock).not.toHaveBeenCalled();
      expect(confirm).not.toHaveBeenCalled();
    }
  );

  it.each(["4999,6 м", "10 км трейл", "11 км"])(
    "использует исходную дистанцию %s без округления",
    async (distanceLabel) => {
      const { hook, fetchMock, confirm } = setup();
      await hook.result.current(createCompetition({ distanceLabel, distanceMeters: 5000 }));
      expect(fetchMock).not.toHaveBeenCalled();
      expect(confirm).not.toHaveBeenCalled();
    }
  );

  it.each(["39:30", "00:39:30.00", "39:29.99"])(
    "не предлагает равный или худший результат при рекорде %s",
    async (timeText) => {
      const { hook, confirm } = setup([{ distanceKey: "10k", timeText }]);
      await hook.result.current(createCompetition());
      expect(confirm).not.toHaveBeenCalled();
    }
  );

  it("предлагает улучшение на сотую секунды и пишет каноническое время", async () => {
    const { hook, fetchMock, confirm, getConfig } = setup([
      { distanceKey: "10k", timeText: "39:30.10" },
    ]);
    await hook.result.current(createCompetition({ result: "39:30,09" }));
    expect(confirm).toHaveBeenCalledTimes(1);
    fetchMock.mockResolvedValueOnce(createJsonResponse({ status: "updated" }));
    await getConfig().onOk?.();
    expect(JSON.parse(String(fetchMock.mock.calls[1][1].body)).records[0].timeText).toBe(
      "00:39:30.09"
    );
  });

  it("при подтверждении переносит только выбранную дистанцию, время, дату и всё название", async () => {
    const { hook, fetchMock, messageApi, getConfig } = setup([
      { distanceKey: "5k", timeText: "18:00", raceCity: "Казань", protocolUrl: "https://old.test" },
    ]);
    await hook.result.current(createCompetition({ nameLocation: "Забег, Москва" }));
    fetchMock.mockResolvedValueOnce(createJsonResponse({ status: "updated" }));
    await getConfig().onOk?.();

    expect(fetchMock).toHaveBeenLastCalledWith("/api/personal-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        onlyIfBetter: true,
        records: [
          {
            distanceKey: "10k",
            timeText: "00:39:30",
            recordDate: "2026-05-10",
            raceName: "Забег, Москва",
            raceCity: null,
            protocolUrl: null,
          },
        ],
      }),
    });
    expect(messageApi.success).toHaveBeenCalledWith(personalRecordOfferLabels.saveSuccess);
  });

  it("не пишет рекорд после пропуска даже через сохранённый onOk", async () => {
    const { hook, fetchMock, getConfig } = setup();
    await hook.result.current(createCompetition());
    const config = getConfig();
    config.onCancel?.();
    await config.onOk?.();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("не проверяет эквивалентные дистанцию и результат при изменении метаданных", async () => {
    const { hook, fetchMock, confirm } = setup();
    await hook.result.current(
      createCompetition({ distanceLabel: "10000 м", result: "00:39:30.00", date: "2026-06-01" }),
      createCompetition({ nameLocation: "Старое название" })
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });

  it("проверяет новый результат после изменения дистанции", async () => {
    const { hook, confirm } = setup();
    await hook.result.current(createCompetition(), createCompetition({ distanceLabel: "5 км" }));
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it("не повторяет предложение для эквивалентных десятых и сотых", async () => {
    const { hook, fetchMock } = setup();
    await hook.result.current(
      createCompetition({ result: "00:39:30.10" }),
      createCompetition({ result: "39:30,1" })
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["00:00", "DNF", ""])(
    "просит проверить невалидный текущий рекорд %s",
    async (timeText) => {
      const { hook, fetchMock, messageApi, confirm } = setup([{ distanceKey: "10k", timeText }]);
      await expect(hook.result.current(createCompetition())).resolves.toBeUndefined();
      expect(confirm).not.toHaveBeenCalled();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(messageApi.warning).toHaveBeenCalledWith(
        personalRecordOfferLabels.invalidCurrentRecord
      );
    }
  );

  it.each([
    null,
    {},
    { error: "failed" },
    { records: null },
    { records: [null] },
    { records: [{ distanceKey: "10k" }] },
    { records: [{ distanceKey: "oops", timeText: "40:00" }] },
    {
      records: [
        { distanceKey: "10k", timeText: "40:00" },
        { distanceKey: "10k", timeText: "41:00" },
      ],
    },
  ])("не принимает некорректный GET %j за отсутствие рекорда", async (data) => {
    const { hook, fetchMock, confirm, messageApi } = setup();
    fetchMock.mockResolvedValueOnce(createJsonResponse(data));
    await expect(hook.result.current(createCompetition())).resolves.toBeUndefined();
    expect(confirm).not.toHaveBeenCalled();
    expect(messageApi.error).toHaveBeenCalledWith(personalRecordOfferLabels.loadFail);
  });

  it("поглощает ошибку сети при чтении", async () => {
    const { hook, fetchMock, confirm, messageApi } = setup();
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await expect(hook.result.current(createCompetition())).resolves.toBeUndefined();
    expect(confirm).not.toHaveBeenCalled();
    expect(messageApi.error).toHaveBeenCalledWith(personalRecordOfferLabels.loadFail);
  });

  it("поглощает ошибку HTTP при чтении", async () => {
    const { hook, fetchMock, confirm, messageApi } = setup();
    fetchMock.mockResolvedValueOnce(createJsonResponse({ records: [] }, 500));
    await expect(hook.result.current(createCompetition())).resolves.toBeUndefined();
    expect(confirm).not.toHaveBeenCalled();
    expect(messageApi.error).toHaveBeenCalledWith(personalRecordOfferLabels.loadFail);
  });

  it("поглощает ошибку открытия предложения", async () => {
    const { hook, confirm, messageApi } = setup();
    confirm.mockImplementationOnce(() => {
      throw new Error("cannot open");
    });
    await expect(hook.result.current(createCompetition())).resolves.toBeUndefined();
    expect(messageApi.error).toHaveBeenCalledWith(personalRecordOfferLabels.loadFail);
  });

  it("оставляет диалог после ошибки записи и позволяет повторить", async () => {
    const { hook, fetchMock, dialog, messageApi, getConfig } = setup();
    await hook.result.current(createCompetition());
    fetchMock.mockResolvedValueOnce(createJsonResponse({ error: "failed" }, 500));
    await expect(getConfig().onOk?.()).rejects.toThrow();
    expect(dialog.destroy).not.toHaveBeenCalled();
    const content = render(<>{getConfig().content}</>);
    expect(screen.getByRole("alert").textContent).toContain(personalRecordOfferLabels.saveFail);

    fetchMock.mockResolvedValueOnce(createJsonResponse({ status: "updated" }));
    await expect(getConfig().onOk?.()).resolves.toBeUndefined();
    content.rerender(<>{getConfig().content}</>);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(messageApi.success).toHaveBeenCalledWith(personalRecordOfferLabels.saveSuccess);
  });

  it("показывает локальную ошибку сети при записи", async () => {
    const { hook, fetchMock, getConfig } = setup();
    await hook.result.current(createCompetition());
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await expect(getConfig().onOk?.()).rejects.toThrow();
    render(<>{getConfig().content}</>);
    expect(screen.getByRole("alert").textContent).toContain(personalRecordOfferLabels.saveFail);
  });

  it("не считает неизвестный ответ записи успешным", async () => {
    const { hook, fetchMock, getConfig, messageApi } = setup();
    await hook.result.current(createCompetition());
    fetchMock.mockResolvedValueOnce(createJsonResponse({ status: "oops" }));
    await expect(getConfig().onOk?.()).rejects.toThrow();
    expect(messageApi.success).not.toHaveBeenCalled();
  });

  it.each(["conflict", "not_better"] as const)(
    "закрывает устаревшее предложение при %s",
    async (status) => {
      const { hook, fetchMock, getConfig, messageApi } = setup();
      await hook.result.current(createCompetition());
      fetchMock.mockResolvedValueOnce(createJsonResponse({ status }));
      await expect(getConfig().onOk?.()).resolves.toBeUndefined();
      expect(messageApi.info).toHaveBeenCalledWith(
        status === "conflict"
          ? personalRecordOfferLabels.conflict
          : personalRecordOfferLabels.notBetter
      );
      expect(messageApi.success).not.toHaveBeenCalled();
    }
  );

  it("просит проверить прежний рекорд при серверной ошибке invalid_current_record", async () => {
    const { hook, fetchMock, getConfig } = setup();
    await hook.result.current(createCompetition());
    fetchMock.mockResolvedValueOnce(createJsonResponse({ error: "invalid_current_record" }, 409));
    await expect(getConfig().onOk?.()).rejects.toThrow();
    render(<>{getConfig().content}</>);
    expect(screen.getByRole("alert").textContent).toContain(
      personalRecordOfferLabels.invalidCurrentRecord
    );
  });

  it("не открывает диалог после позднего ответа и unmount", async () => {
    const { hook, fetchMock, confirm } = setup();
    let resolveResponse!: (response: Response) => void;
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveResponse = resolve;
      })
    );
    const pending = hook.result.current(createCompetition());
    hook.unmount();
    resolveResponse(createJsonResponse({ records: [] }));
    await pending;
    expect(confirm).not.toHaveBeenCalled();
  });

  it("убирает открытый диалог и запрещает запись после unmount", async () => {
    const { hook, fetchMock, dialog, getConfig } = setup();
    await hook.result.current(createCompetition());
    const onOk = getConfig().onOk;
    hook.unmount();
    expect(dialog.destroy).toHaveBeenCalledTimes(1);
    await onOk?.();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("не показывает позднюю ошибку после unmount", async () => {
    const { hook, fetchMock, messageApi } = setup();
    let rejectResponse!: (error: Error) => void;
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((_resolve, reject) => {
        rejectResponse = reject;
      })
    );
    const pending = hook.result.current(createCompetition());
    hook.unmount();
    rejectResponse(new Error("offline"));
    await pending;
    expect(messageApi.error).not.toHaveBeenCalled();
  });

  it.each([200, 500])(
    "не показывает поздний ответ записи HTTP %s после unmount",
    async (status) => {
      const { hook, fetchMock, messageApi, dialog, getConfig } = setup();
      await hook.result.current(createCompetition());
      let resolveResponse!: (response: Response) => void;
      fetchMock.mockReturnValueOnce(
        new Promise<Response>((resolve) => {
          resolveResponse = resolve;
        })
      );
      const pending = getConfig().onOk?.();
      hook.unmount();
      resolveResponse(createJsonResponse({ status: "updated" }, status));
      await pending;
      expect(messageApi.success).not.toHaveBeenCalled();
      expect(messageApi.info).not.toHaveBeenCalled();
      expect(messageApi.error).not.toHaveBeenCalled();
      expect(dialog.update).toHaveBeenCalledTimes(1);
    }
  );

  it("настраивает штатное закрытие по Escape и начальный фокус на пропуске", async () => {
    const { hook, getConfig } = setup();
    await hook.result.current(createCompetition());
    expect(getConfig().keyboard).toBe(true);
    expect(getConfig().focusable).toEqual({ autoFocusButton: "cancel" });
    expect(getConfig().mask).toEqual({ closable: false });
  });
});
