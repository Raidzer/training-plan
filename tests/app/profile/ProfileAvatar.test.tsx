import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ConfigProvider } from "antd";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const imageMocks = vi.hoisted(() => ({ load: vi.fn(), crop: vi.fn() }));
vi.mock("@/app/(protected)/profile/ProfileClient/utils/avatarImage", () => ({
  loadAvatarImage: imageMocks.load,
  createAvatarBlob: imageMocks.crop,
}));

import { ProfileAvatar } from "@/app/(protected)/profile/ProfileClient/components/ProfileAvatar/ProfileAvatar";

describe("ProfileAvatar", () => {
  const originalGetComputedStyle = window.getComputedStyle.bind(window);

  beforeEach(() => {
    imageMocks.load.mockReset();
    imageMocks.crop.mockReset();
    vi.spyOn(window, "getComputedStyle").mockImplementation((element) =>
      originalGetComputedStyle(element)
    );
    vi.stubGlobal("fetch", vi.fn());
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("открывает окно загрузки по клику на аватар без фото", () => {
    render(<ProfileAvatar initials="ИП" displayName="Иван Петров" initialVersion={null} />);

    const avatarButton = screen.getByRole("button", { name: "Добавить фото" });
    expect(avatarButton).toBeInstanceOf(HTMLButtonElement);
    expect(within(avatarButton).getByText("ИП")).toBeTruthy();
    expect(screen.getByText("Нажмите на аватар, чтобы добавить фото")).toBeTruthy();

    fireEvent.click(avatarButton);

    expect(screen.getByRole("dialog", { name: "Добавить фото профиля" })).toBeTruthy();
    expect(screen.getByText("Перетащите фото сюда")).toBeTruthy();
  });

  it("передаёт файл из dropzone в загрузку и открывает кадрирование", async () => {
    imageMocks.load.mockResolvedValueOnce({
      url: "blob:source",
      image: {} as HTMLImageElement,
    });
    render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <ProfileAvatar initials="ИП" displayName="Иван Петров" initialVersion={null} />
      </ConfigProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Добавить фото" }));
    const dialog = screen.getByRole("dialog", { name: "Добавить фото профиля" });
    const input = dialog.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["image"], "photo.jpg", { type: "image/jpeg" });

    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByRole("dialog", { name: "Кадрирование фотографии" })).toBeTruthy();
    expect(screen.queryByRole("dialog", { name: "Добавить фото профиля" })).toBeNull();
    expect(imageMocks.load).toHaveBeenCalledWith(file);
  });

  it("открывает выбор файла по Space на dropzone", () => {
    render(<ProfileAvatar initials="ИП" displayName="Иван Петров" initialVersion={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Добавить фото" }));
    const dropzone = screen.getByRole("button", { name: /Перетащите фото сюда/ });
    const input = screen
      .getByRole("dialog", { name: "Добавить фото профиля" })
      .querySelector('input[type="file"]') as HTMLInputElement;
    const inputClick = vi.spyOn(input, "click");

    fireEvent.keyDown(dropzone, { key: " " });

    expect(inputClick).toHaveBeenCalledTimes(1);
  });

  it("открывает кадрирование текущего фото и удаляет его из окна", async () => {
    const response = new Response(new Blob(["image"], { type: "image/webp" }));
    vi.mocked(fetch).mockResolvedValueOnce(response);
    imageMocks.load.mockResolvedValueOnce({
      url: "blob:current",
      image: {} as HTMLImageElement,
    });
    render(<ProfileAvatar initials="ИП" displayName="Иван Петров" initialVersion="version-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Открыть кадрирование фото" }));

    const cropDialog = await screen.findByRole("dialog", { name: "Кадрирование фотографии" });
    expect(cropDialog).toBeTruthy();
    expect(screen.getByRole("button", { name: "Удалить фото" })).toBeTruthy();

    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ success: true })));
    fireEvent.click(screen.getByRole("button", { name: "Удалить фото" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Добавить фото" })).toBeTruthy();
    });
  });

  it("оставляет удаление доступным, если сохранённое фото не удалось открыть", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 404 }));
    render(<ProfileAvatar initials="ИП" displayName="Иван Петров" initialVersion="version-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Открыть кадрирование фото" }));

    const uploadDialog = await screen.findByRole("dialog", { name: "Добавить фото профиля" });
    expect(within(uploadDialog).getByRole("button", { name: "Удалить фото" })).toBeTruthy();
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ success: true })));
    fireEvent.click(within(uploadDialog).getByRole("button", { name: "Удалить фото" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Добавить фото" })).toBeTruthy();
    });
  });

  it("возвращает фокус на аватар после отмены кадрирования", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(new Blob(["image"], { type: "image/webp" }))
    );
    imageMocks.load.mockResolvedValueOnce({
      url: "blob:source",
      image: {} as HTMLImageElement,
    });
    render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <ProfileAvatar initials="ИП" displayName="Иван Петров" initialVersion="version-1" />
      </ConfigProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Открыть кадрирование фото" }));
    await screen.findByRole("dialog", { name: "Кадрирование фотографии" });
    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));

    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Открыть кадрирование фото" })
      );
    });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:source");
  });
});
