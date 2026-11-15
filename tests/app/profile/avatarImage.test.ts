import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAvatarBlob,
  loadAvatarImage,
} from "@/app/(protected)/profile/ProfileClient/utils/avatarImage";

describe("подготовка фотографии профиля", () => {
  const decode = vi.fn();
  const createObjectURL = vi.fn();
  const revokeObjectURL = vi.fn();
  let dimensions: { naturalWidth: number; naturalHeight: number };

  beforeEach(() => {
    dimensions = { naturalWidth: 1200, naturalHeight: 800 };
    decode.mockResolvedValue(undefined);
    createObjectURL.mockReturnValue("blob:avatar-source");
    vi.stubGlobal(
      "Image",
      class {
        src = "";
        get naturalWidth() {
          return dimensions.naturalWidth;
        }
        get naturalHeight() {
          return dimensions.naturalHeight;
        }
        decode = decode;
      }
    );
    vi.spyOn(URL, "createObjectURL").mockImplementation(createObjectURL);
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(revokeObjectURL);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each([
    [new File(["svg"], "photo.svg", { type: "image/svg+xml" }), /JPEG.*PNG.*WebP/],
    [new File([""], "photo.jpg", { type: "image/jpeg" }), /пуст/],
    [new File([new Uint8Array(10 * 1024 * 1024 + 1)], "photo.png", { type: "image/png" }), /10/],
  ])("отклоняет неподходящий исходник до декодирования", async (file, message) => {
    await expect(loadAvatarImage(file)).rejects.toThrow(message);
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(decode).not.toHaveBeenCalled();
  });

  it("освобождает URL при ошибке декодирования и слишком большом изображении", async () => {
    const file = new File(["image"], "photo.jpg", { type: "image/jpeg" });
    decode.mockRejectedValueOnce(new Error("decode"));
    await expect(loadAvatarImage(file)).rejects.toThrow(/открыть/);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:avatar-source");

    dimensions = { naturalWidth: 8000, naturalHeight: 6000 };
    await expect(loadAvatarImage(file)).rejects.toThrow(/40/);
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it("рисует только выбранный фрагмент в квадрат 512 × 512 и кодирует WebP", async () => {
    const image = { naturalWidth: 1200, naturalHeight: 800 } as HTMLImageElement;
    const drawImage = vi.fn();
    const blob = new Blob(["webp"], { type: "image/webp" });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (
      this: HTMLCanvasElement,
      callback,
      type
    ) {
      expect(this.width).toBe(512);
      expect(this.height).toBe(512);
      expect(type).toBe("image/webp");
      callback(blob);
    });

    await expect(
      createAvatarBlob(image, { x: 250, y: 100, width: 600, height: 600 })
    ).resolves.toBe(blob);
    expect(drawImage).toHaveBeenCalledWith(image, 250, 100, 600, 600, 0, 0, 512, 512);

    toBlob.mockImplementation((callback) => callback(null));
    await expect(createAvatarBlob(image, { x: 0, y: 0, width: 800, height: 800 })).rejects.toThrow(
      /обработать/
    );
  });

  it("не отправляет неподдерживаемый результат браузерного кодировщика", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => {
      callback(new Blob(["png"], { type: "image/png" }));
    });
    await expect(
      createAvatarBlob({ naturalWidth: 800, naturalHeight: 800 } as HTMLImageElement, {
        x: 0,
        y: 0,
        width: 800,
        height: 800,
      })
    ).rejects.toThrow(/WebP/);
  });

  it("объясняет ошибку Canvas на русском и отклоняет геометрию за пределами фотографии", async () => {
    const image = { naturalWidth: 800, naturalHeight: 800 } as HTMLImageElement;
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(() => {
      throw new DOMException("The canvas has been tainted", "SecurityError");
    });
    await expect(createAvatarBlob(image, { x: 0, y: 0, width: 800, height: 800 })).rejects.toThrow(
      /обработать/
    );
    await expect(createAvatarBlob(image, { x: -1, y: 0, width: 800, height: 800 })).rejects.toThrow(
      /обработать/
    );
  });
});
