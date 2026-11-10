import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const imageMocks = vi.hoisted(() => ({ load: vi.fn(), crop: vi.fn() }));
vi.mock("@/app/(protected)/profile/ProfileClient/utils/avatarImage", () => ({
  loadAvatarImage: imageMocks.load,
  createAvatarBlob: imageMocks.crop,
}));

import { useProfileAvatar } from "@/app/(protected)/profile/ProfileClient/hooks/useProfileAvatar";

const FILE = new File(["image"], "photo.jpg", { type: "image/jpeg" });
const AREA = { x: 0, y: 0, width: 800, height: 800 };

describe("useProfileAvatar", () => {
  const revokeObjectURL = vi.fn();
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(revokeObjectURL);
    vi.stubGlobal("fetch", fetchMock);
    imageMocks.load.mockResolvedValue({ url: "blob:source", image: {} });
    imageMocks.crop.mockResolvedValue(new Blob(["webp"], { type: "image/webp" }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("отменяет кадрирование без запроса и освобождает исходники при замене и размонтировании", async () => {
    const { result, unmount } = renderHook(() => useProfileAvatar("old-version"));
    await act(async () => result.current.selectFile(FILE));
    act(() => result.current.cancelCrop());
    expect(result.current.source).toBeNull();
    expect(result.current.version).toBe("old-version");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:source");
    expect(fetchMock).not.toHaveBeenCalled();

    await act(async () => result.current.selectFile(FILE));
    imageMocks.load.mockResolvedValueOnce({ url: "blob:replacement", image: {} });
    await act(async () => result.current.selectFile(FILE));
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledTimes(3);
    expect(revokeObjectURL).toHaveBeenLastCalledWith("blob:replacement");
  });

  it("сохраняет raw WebP один раз и не сбрасывает новую версию при обновлении данных профиля", async () => {
    let resolveRequest: (response: Response) => void = () => {};
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveRequest = resolve;
      })
    );
    const { result, rerender } = renderHook(({ version }) => useProfileAvatar(version), {
      initialProps: { version: "old-version" },
    });
    await act(async () => result.current.selectFile(FILE));
    let saving: Promise<void>;
    act(() => {
      saving = result.current.saveCrop(AREA);
    });
    await act(async () => {
      await result.current.saveCrop(AREA);
      await result.current.deleteAvatar();
      result.current.cancelCrop();
    });
    expect(result.current.source).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/profile/avatar",
      expect.objectContaining({
        method: "PUT",
        body: expect.any(Blob),
        headers: { "Content-Type": "image/webp" },
      })
    );

    await act(async () => {
      resolveRequest(new Response(JSON.stringify({ version: "new-version" })));
      await saving;
    });
    expect(result.current.version).toBe("new-version");
    expect(result.current.source).toBeNull();
    rerender({ version: "old-version" });
    expect(result.current.version).toBe("new-version");
  });

  it("оставляет старое фото и исходник при ошибке сети, позволяет повторить сохранение", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const { result } = renderHook(() => useProfileAvatar("old-version"));
    await act(async () => result.current.selectFile(FILE));
    await act(async () => result.current.saveCrop(AREA));
    expect(result.current.version).toBe("old-version");
    expect(result.current.source).not.toBeNull();
    expect(result.current.error).toMatch(/соединение|сети/);
    expect(result.current.operation).toBeNull();

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ version: "new-version" })));
    await act(async () => result.current.saveCrop(AREA));
    expect(result.current.version).toBe("new-version");
  });

  it("удаляет фото идемпотентным запросом и сохраняет версию при ошибке", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Попробуйте позже" }), { status: 500 })
    );
    const { result } = renderHook(() => useProfileAvatar("old-version"));
    await act(async () => result.current.deleteAvatar());
    expect(result.current.version).toBe("old-version");
    expect(result.current.error).toBe("Попробуйте позже");
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ success: true })));
    await act(async () => result.current.deleteAvatar());
    expect(result.current.version).toBeNull();
    expect(fetchMock).toHaveBeenLastCalledWith("/api/profile/avatar", { method: "DELETE" });
  });

  it("освобождает поздно декодированный исходник после отмены", async () => {
    let resolveLoad: (source: { url: string; image: object }) => void = () => {};
    imageMocks.load.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveLoad = resolve;
      })
    );
    const { result } = renderHook(() => useProfileAvatar(null));
    let loading: Promise<void>;
    act(() => {
      loading = result.current.selectFile(FILE);
    });
    act(() => result.current.cancelCrop());
    await act(async () => {
      resolveLoad({ url: "blob:late", image: {} });
      await loading;
    });
    expect(result.current.source).toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:late");
  });
});
