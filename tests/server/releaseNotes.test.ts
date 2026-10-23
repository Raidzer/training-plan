import { readFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getCurrentReleaseNotes } from "@/server/releaseNotes";

vi.mock("node:fs/promises", () => {
  const readFile = vi.fn();
  return { readFile, default: { readFile } };
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getCurrentReleaseNotes", () => {
  it("читает канонический файл на сервере и возвращает только установленный релиз", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_VERSION", "1.3.0-a4672b2");
    vi.stubEnv("NEXT_PUBLIC_GIT_SHA", "a4672b2");
    vi.mocked(readFile).mockResolvedValue("## 1.3.0\n- Текущий\n## 1.2.0\n- Предыдущий");

    expect(await getCurrentReleaseNotes()).toEqual({
      version: "1.3.0",
      sections: [{ title: null, items: ["Текущий"] }],
    });
    expect(readFile).toHaveBeenCalledWith(
      path.join(process.cwd(), "src/releases/CHANGELOG.md"),
      "utf8"
    );
  });

  it("не читает файл для dev-сборки", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_VERSION", "");

    expect(await getCurrentReleaseNotes()).toBeNull();
    expect(readFile).not.toHaveBeenCalled();
  });

  it("оставляет версию текстом при отсутствии описания", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_VERSION", "1.3.0");
    vi.mocked(readFile).mockResolvedValue("# История изменений\n");

    expect(await getCurrentReleaseNotes()).toBeNull();
  });

  it("не скрывает ошибку чтения файла", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_VERSION", "1.3.0");
    vi.mocked(readFile).mockRejectedValue(new Error("Нет доступа к файлу"));

    await expect(getCurrentReleaseNotes()).rejects.toThrow("Нет доступа к файлу");
  });
});
