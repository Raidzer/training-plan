import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { shoesLabels } from "@/app/(protected)/profile/shoes/ShoesClient/constants/shoesConstants";
import { useShoes } from "@/app/(protected)/profile/shoes/ShoesClient/hooks/useShoes";
import type { ShoeItem } from "@/app/(protected)/profile/shoes/ShoesClient/types/shoesTypes";
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

function createShoe(overrides: Partial<ShoeItem> = {}): ShoeItem {
  return {
    id: 1,
    name: "Daily Trainer",
    mileageLimitKm: "800",
    currentMileageKm: "120",
    notifyOnLimitEmail: true,
    notifyOnLimitTelegram: false,
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-02T00:00:00.000Z",
    ...overrides,
  };
}

async function renderUseShoes(initialShoes: ShoeItem[] = []) {
  const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ shoes: initialShoes }));
  global.fetch = fetchMock as unknown as typeof fetch;
  const messageApi = createMessageApi();
  const modalApi = createModalApi();

  const hook = renderHook(() =>
    useShoes({
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

describe("useShoes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn() as unknown as typeof fetch;
  });

  it("loads shoes on mount", async () => {
    const shoe = createShoe();
    const { hook, fetchMock } = await renderUseShoes([shoe]);

    expect(fetchMock).toHaveBeenCalledWith("/api/shoes", {
      cache: "no-store",
    });
    expect(hook.result.current.items).toEqual([shoe]);
  });

  it("validates create form before request", async () => {
    const { hook, fetchMock, messageApi } = await renderUseShoes();

    act(() => {
      hook.result.current.updateNewForm("name", " ");
    });

    await act(async () => {
      await hook.result.current.handleCreate();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(messageApi.warning).toHaveBeenCalledWith(shoesLabels.nameRequired);
  });

  it("validates mileage before create request", async () => {
    const { hook, fetchMock, messageApi } = await renderUseShoes();

    act(() => {
      hook.result.current.updateNewForm("name", "Daily");
      hook.result.current.updateNewForm("mileageLimitKm", "bad");
    });

    await act(async () => {
      await hook.result.current.handleCreate();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(messageApi.warning).toHaveBeenCalledWith(shoesLabels.mileageInvalid);
  });

  it("creates shoe and resets create form", async () => {
    const created = createShoe({
      id: 2,
      name: "Race Shoe",
      mileageLimitKm: "500.5",
    });
    const { hook, fetchMock, messageApi } = await renderUseShoes();
    fetchMock.mockResolvedValueOnce(createJsonResponse({ shoe: created }));

    act(() => {
      hook.result.current.updateNewForm("name", " Race Shoe ");
      hook.result.current.updateNewForm("mileageLimitKm", "500,5");
      hook.result.current.updateNewForm("notifyOnLimitEmail", true);
    });

    await act(async () => {
      await hook.result.current.handleCreate();
    });

    const createRequest = fetchMock.mock.calls[1]?.[1] as RequestInit;

    expect(createRequest.method).toBe("POST");
    expect(JSON.parse(String(createRequest.body))).toEqual({
      name: "Race Shoe",
      mileageLimitKm: 500.5,
      notifyOnLimitEmail: true,
      notifyOnLimitTelegram: false,
    });
    expect(hook.result.current.items).toEqual([created]);
    expect(hook.result.current.newForm.name).toBe("");
    expect(messageApi.success).toHaveBeenCalledWith(shoesLabels.saveOk);
  });

  it("updates selected shoe and exits edit mode", async () => {
    const shoe = createShoe();
    const updated = createShoe({
      name: "Updated Trainer",
      notifyOnLimitTelegram: true,
    });
    const { hook, fetchMock, messageApi } = await renderUseShoes([shoe]);
    fetchMock.mockResolvedValueOnce(createJsonResponse({ shoe: updated }));

    act(() => {
      hook.result.current.handleStartEdit(shoe);
      hook.result.current.updateEditingForm("name", " Updated Trainer ");
      hook.result.current.updateEditingForm("notifyOnLimitTelegram", true);
    });

    await act(async () => {
      await hook.result.current.handleSaveEdit();
    });

    const updateRequest = fetchMock.mock.calls[1]?.[1] as RequestInit;

    expect(updateRequest.method).toBe("PATCH");
    expect(hook.result.current.items).toEqual([updated]);
    expect(hook.result.current.editingId).toBeNull();
    expect(messageApi.success).toHaveBeenCalledWith(shoesLabels.updateOk);
  });

  it("ignores save edit without selected shoe and validates edit payload", async () => {
    const shoe = createShoe();
    const { hook, fetchMock, messageApi } = await renderUseShoes([shoe]);

    await act(async () => {
      await hook.result.current.handleSaveEdit();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    act(() => {
      hook.result.current.handleStartEdit(shoe);
      hook.result.current.updateEditingForm("mileageLimitKm", "bad");
    });

    await act(async () => {
      await hook.result.current.handleSaveEdit();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(messageApi.warning).toHaveBeenCalledWith(shoesLabels.mileageInvalid);
  });

  it("shows errors for failed create and update responses", async () => {
    const shoe = createShoe();
    const { hook, fetchMock, messageApi } = await renderUseShoes([shoe]);

    act(() => {
      hook.result.current.updateNewForm("name", "Daily");
    });
    fetchMock.mockResolvedValueOnce(createJsonResponse({ error: "failed" }, 500));

    await act(async () => {
      await hook.result.current.handleCreate();
    });

    act(() => {
      hook.result.current.handleStartEdit(shoe);
      hook.result.current.updateEditingForm("name", "Updated");
    });
    fetchMock.mockResolvedValueOnce(createJsonResponse({ shoe: null }));

    await act(async () => {
      await hook.result.current.handleSaveEdit();
    });

    expect(messageApi.error).toHaveBeenCalledWith(shoesLabels.saveFail);
    expect(messageApi.error).toHaveBeenCalledWith(shoesLabels.updateFail);
  });

  it("shows errors for network failures", async () => {
    const shoe = createShoe();
    const { hook, fetchMock, messageApi } = await renderUseShoes([shoe]);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    act(() => {
      hook.result.current.updateNewForm("name", "Daily");
    });
    fetchMock.mockRejectedValueOnce(new Error("create-network"));

    await act(async () => {
      await hook.result.current.handleCreate();
    });

    act(() => {
      hook.result.current.handleStartEdit(shoe);
      hook.result.current.updateEditingForm("name", "Updated");
    });
    fetchMock.mockRejectedValueOnce(new Error("update-network"));

    await act(async () => {
      await hook.result.current.handleSaveEdit();
    });

    expect(messageApi.error).toHaveBeenCalledWith(shoesLabels.saveFail);
    expect(messageApi.error).toHaveBeenCalledWith(shoesLabels.updateFail);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(2);

    consoleErrorSpy.mockRestore();
  });

  it("deletes shoe only after confirmation", async () => {
    const shoe = createShoe();
    const { hook, fetchMock, messageApi, modalApi } = await renderUseShoes([shoe]);
    const confirmMock = modalApi.confirm as ReturnType<typeof vi.fn>;

    confirmMock.mockImplementationOnce((options) => {
      options.onCancel?.();
      return undefined;
    });

    await act(async () => {
      await hook.result.current.handleDelete(shoe);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(hook.result.current.items).toEqual([shoe]);

    confirmMock.mockImplementationOnce((options) => {
      options.onOk?.();
      return undefined;
    });
    fetchMock.mockResolvedValueOnce(createJsonResponse({ success: true }));

    await act(async () => {
      await hook.result.current.handleDelete(shoe);
    });

    const deleteRequest = fetchMock.mock.calls[1]?.[1] as RequestInit;

    expect(deleteRequest.method).toBe("DELETE");
    expect(hook.result.current.items).toEqual([]);
    expect(messageApi.success).toHaveBeenCalledWith(shoesLabels.deleteOk);
  });

  it("shows delete errors and exits edit mode when deleted shoe was edited", async () => {
    const shoe = createShoe();
    const { hook, fetchMock, messageApi, modalApi } = await renderUseShoes([shoe]);
    const confirmMock = modalApi.confirm as ReturnType<typeof vi.fn>;
    confirmMock.mockImplementation((options) => {
      options.onOk?.();
      return undefined;
    });

    fetchMock.mockResolvedValueOnce(createJsonResponse({ error: "failed" }, 500));

    await act(async () => {
      await hook.result.current.handleDelete(shoe);
    });

    expect(messageApi.error).toHaveBeenCalledWith(shoesLabels.deleteFail);
    expect(hook.result.current.items).toEqual([shoe]);

    act(() => {
      hook.result.current.handleStartEdit(shoe);
    });
    fetchMock.mockResolvedValueOnce(createJsonResponse({ success: true }));

    await act(async () => {
      await hook.result.current.handleDelete(shoe);
    });

    expect(hook.result.current.items).toEqual([]);
    expect(hook.result.current.editingId).toBeNull();
  });

  it("handles failed initial load without showing silent mount error", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("load-network"));
    global.fetch = fetchMock as unknown as typeof fetch;
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const messageApi = createMessageApi();
    const modalApi = createModalApi();

    const hook = renderHook(() =>
      useShoes({
        messageApi,
        modalApi,
      })
    );

    await waitFor(() => {
      expect(hook.result.current.loading).toBe(false);
    });

    expect(hook.result.current.items).toEqual([]);
    expect(messageApi.error).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));

    consoleErrorSpy.mockRestore();
  });
});
