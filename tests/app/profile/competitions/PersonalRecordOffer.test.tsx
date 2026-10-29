import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App, ConfigProvider } from "antd";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCompetitionPersonalRecord } from "@/app/(protected)/profile/competitions/CompetitionsClient/hooks/useCompetitionPersonalRecord";
import { personalRecordOfferLabels } from "@/app/(protected)/profile/competitions/CompetitionsClient/constants/personalRecordOfferConstants";
import { COMPETITION_PRIORITIES } from "@/shared/constants/competitions";

function OfferTrigger() {
  const { message, modal } = App.useApp();
  const offerPersonalRecord = useCompetitionPersonalRecord({
    messageApi: message,
    modalApi: modal,
  });

  return (
    <button
      onClick={() =>
        void offerPersonalRecord({
          id: 1,
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
        })
      }
    >
      Проверить рекорд
    </button>
  );
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function renderOfferTrigger() {
  return render(
    <ConfigProvider theme={{ token: { motion: false } }}>
      <App>
        <OfferTrigger />
      </App>
    </ConfigProvider>
  );
}

const originalGetComputedStyle = window.getComputedStyle.bind(window);

describe("PersonalRecordOffer с настоящим Ant Design modal", () => {
  beforeEach(() => {
    vi.spyOn(window, "getComputedStyle").mockImplementation((element) =>
      originalGetComputedStyle(element)
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("оставляет диалог открытым после ошибки onOk без unhandled rejection и повторяет запись", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ records: [] }))
      .mockResolvedValueOnce(jsonResponse({ error: "failed" }, 500))
      .mockResolvedValueOnce(jsonResponse({ status: "updated" }));
    global.fetch = fetchMock as typeof fetch;
    renderOfferTrigger();
    fireEvent.click(screen.getByRole("button", { name: "Проверить рекорд" }));
    const saveButton = await screen.findByRole("button", {
      name: personalRecordOfferLabels.saveButton,
    });
    expect(screen.getByRole("dialog").getAttribute("aria-labelledby")).toBeTruthy();
    fireEvent.click(saveButton);
    const error = await screen.findByRole("alert");
    expect(error.textContent).toContain(personalRecordOfferLabels.saveFail);
    expect(screen.getByRole("dialog")).toBeTruthy();
    await waitFor(() => expect(saveButton.className).not.toContain("ant-btn-loading"));
    fireEvent.click(saveButton);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(await screen.findByText(personalRecordOfferLabels.saveSuccess)).toBeTruthy();
  });

  it("закрывается по Escape без записи рекорда", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ records: [] }));
    global.fetch = fetchMock as typeof fetch;
    renderOfferTrigger();
    fireEvent.click(screen.getByRole("button", { name: "Проверить рекорд" }));
    const skipButton = await screen.findByRole("button", {
      name: personalRecordOfferLabels.skipButton,
    });
    await waitFor(() => expect(document.activeElement).toBe(skipButton));
    fireEvent.keyDown(skipButton, { key: "Escape", code: "Escape", keyCode: 27 });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("не позволяет пропустить начатую запись, возвращает пропуск и Escape после ошибки", async () => {
    let finishSave!: (response: Response) => void;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ records: [] }))
      .mockReturnValueOnce(new Promise<Response>((resolve) => (finishSave = resolve)));
    global.fetch = fetchMock as typeof fetch;
    renderOfferTrigger();
    fireEvent.click(screen.getByRole("button", { name: "Проверить рекорд" }));
    fireEvent.click(
      await screen.findByRole("button", { name: personalRecordOfferLabels.saveButton })
    );
    const skipButton = screen.getByRole("button", {
      name: personalRecordOfferLabels.skipButton,
    }) as HTMLButtonElement;
    await waitFor(() => expect(skipButton.disabled).toBe(true));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape", code: "Escape", keyCode: 27 });
    expect(screen.getByRole("dialog")).toBeTruthy();

    finishSave(jsonResponse({ error: "failed" }, 500));
    await screen.findByRole("alert");
    await waitFor(() => expect(skipButton.disabled).toBe(false));
    fireEvent.keyDown(skipButton, { key: "Escape", code: "Escape", keyCode: 27 });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
