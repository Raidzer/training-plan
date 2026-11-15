import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("показывает инициалы без запроса отсутствующего аватара", () => {
    render(<ProfileAvatar initials="ИП" displayName="Иван Петров" initialVersion={null} />);
    expect(screen.getByRole("img", { name: /Иван Петров/ }).textContent).toBe("ИП");
    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByRole("button", { name: "Выбрать фото" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Удалить фото" })).toBeNull();
  });

  it("возвращается к инициалам при ошибке изображения и позволяет удалить аватар", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ success: true })));
    render(<ProfileAvatar initials="ИП" displayName="Иван Петров" initialVersion="version-1" />);
    const image = screen.getByRole("img", { name: /Иван Петров/ });
    expect(image.getAttribute("src")).toMatch(/\/api\/profile\/avatar\?v=version-1$/);
    fireEvent.error(image);
    expect(screen.getByRole("img", { name: /Иван Петров/ }).textContent).toBe("ИП");
    fireEvent.click(screen.getByRole("button", { name: "Удалить фото" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Удалить фото" })).toBeNull());
  });

  it("сбрасывает выбор файла, показывает ошибку и принимает тот же файл повторно", async () => {
    imageMocks.load.mockRejectedValue(new Error("Не удалось открыть фотографию"));
    render(<ProfileAvatar initials="ИП" displayName="Иван Петров" initialVersion={null} />);
    const input = screen.getByLabelText("Файл фотографии профиля") as HTMLInputElement;
    const file = new File(["image"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [file] } });
    await screen.findByRole("alert");
    expect(input.value).toBe("");
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(imageMocks.load).toHaveBeenCalledTimes(2));
  });

  it("открывает кадрирование и отменяет его без серверного запроса", async () => {
    imageMocks.load.mockResolvedValueOnce({ url: "blob:source", image: {} });
    render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <ProfileAvatar initials="ИП" displayName="Иван Петров" initialVersion={null} />
      </ConfigProvider>
    );
    fireEvent.change(screen.getByLabelText("Файл фотографии профиля"), {
      target: { files: [new File(["image"], "photo.jpg", { type: "image/jpeg" })] },
    });
    expect(await screen.findByRole("dialog", { name: "Кадрирование фотографии" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Выбрать фото" }));
    expect(fetch).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:source");
  });
});
