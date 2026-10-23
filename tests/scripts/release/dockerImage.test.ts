import { describe, expect, it, vi } from "vitest";
import { getBuildVersion, inspectVersionImage } from "@/scripts/release/dockerImage.mjs";
import { SHA } from "./fixtures";

describe("getBuildVersion", () => {
  it("сохраняет prerelease и добавляет короткий SHA для обычной сборки", () => {
    expect(getBuildVersion("1.2.0-beta", "", SHA)).toBe("1.2.0-beta-aaaaaaa");
  });
  it("для релиза использует чистую версию", () => {
    expect(getBuildVersion("1.3.0", "1.3.0", SHA)).toBe("1.3.0");
  });
  it("отклоняет расхождение версии образа и package.json", () => {
    expect(() => getBuildVersion("1.3.0", "1.4.0", SHA)).toThrow();
  });
  it.each(["", "aaaaaaa", "g".repeat(40)])("отклоняет неполный или неверный SHA: %s", (sha) => {
    expect(() => getBuildVersion("1.3.0", "1.3.0", sha)).toThrow();
  });
  it.each(["", "1.3", "dev"])("отклоняет некорректную версию: %s", (version) => {
    expect(() => getBuildVersion(version, "", SHA)).toThrow();
  });
});

describe("inspectVersionImage", () => {
  const manifest = { digest: `sha256:${"b".repeat(64)}` };
  const image = { config: { Labels: { "org.opencontainers.image.revision": SHA } } };
  it("переиспользует образ обеих архитектур того же SHA по digest", async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce({ stdout: JSON.stringify(manifest) })
      .mockResolvedValueOnce({
        stdout: JSON.stringify({ "linux/amd64": image, "linux/arm64": image }),
      });
    expect(await inspectVersionImage("ghcr.io/raidzer/training-plan:v1.3.0", SHA, run)).toBe(
      manifest.digest
    );
    expect(run.mock.calls).toEqual([
      [
        "docker",
        [
          "buildx",
          "imagetools",
          "inspect",
          "ghcr.io/raidzer/training-plan:v1.3.0",
          "--format",
          "{{json .Manifest}}",
        ],
      ],
      [
        "docker",
        [
          "buildx",
          "imagetools",
          "inspect",
          `ghcr.io/raidzer/training-plan@${manifest.digest}`,
          "--format",
          "{{json .Image}}",
        ],
      ],
    ]);
  });
  it.each(["sha", "revision", "architecture"])(
    "блокирует несовместимый образ: %s",
    async (scenario) => {
      const images = {
        "linux/amd64": image,
        "linux/arm64":
          scenario === "sha"
            ? { config: { Labels: { "org.opencontainers.image.revision": "c".repeat(40) } } }
            : scenario === "revision"
              ? { config: { Labels: {} } }
              : undefined,
      };
      const run = vi
        .fn()
        .mockResolvedValueOnce({ stdout: JSON.stringify(manifest) })
        .mockResolvedValueOnce({ stdout: JSON.stringify(images) });
      await expect(
        inspectVersionImage("ghcr.io/raidzer/training-plan:v1.3.0", SHA, run)
      ).rejects.toThrow();
    }
  );
  it("подтверждает отсутствие самого образа после manifest unknown", async () => {
    const run = vi.fn().mockRejectedValue({ stderr: "manifest unknown" });
    expect(await inspectVersionImage("ghcr.io/raidzer/training-plan:v1.3.0", SHA, run)).toBeNull();
    expect(run.mock.calls[1]).toEqual([
      "docker",
      ["buildx", "imagetools", "inspect", "ghcr.io/raidzer/training-plan:v1.3.0", "--raw"],
    ]);
  });
  it("не считает отсутствующим существующий index с потерянным дочерним manifest", async () => {
    const error = new Error("manifest unknown");
    const run = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ stdout: JSON.stringify({ manifests: [] }) });
    await expect(
      inspectVersionImage("ghcr.io/raidzer/training-plan:v1.3.0", SHA, run)
    ).rejects.toBe(error);
  });
  it("не скрывает ошибку доступа при подтверждении отсутствующего manifest", async () => {
    const error = new Error("Unauthorized");
    const run = vi
      .fn()
      .mockRejectedValueOnce(new Error("manifest unknown"))
      .mockRejectedValueOnce(error);
    await expect(
      inspectVersionImage("ghcr.io/raidzer/training-plan:v1.3.0", SHA, run)
    ).rejects.toBe(error);
  });
  it.each([
    { stderr: "ERROR: ghcr.io/raidzer/training-plan:v1.3.0: not found\n" },
    new Error("ERROR: ghcr.io/raidzer/training-plan:v1.3.0: not found\r\n"),
  ])("распознаёт not found для проверяемого тега", async (error) => {
    const run = vi.fn().mockRejectedValue(error);
    expect(await inspectVersionImage("ghcr.io/raidzer/training-plan:v1.3.0", SHA, run)).toBeNull();
    expect(run).toHaveBeenCalledTimes(2);
  });
  it.each([
    "Unauthorized",
    "ECONNRESET",
    "docker: command not found",
    "ERROR: ghcr.io/other/image:v1.3.0: not found",
    "ERROR: ghcr.io/raidzer/training-plan:v1.3.0: failed to fetch token: not found",
  ])("не скрывает ошибки доступа или сети: %s", async (message) => {
    const run = vi.fn().mockRejectedValue(new Error(message));
    await expect(
      inspectVersionImage("ghcr.io/raidzer/training-plan:v1.3.0", SHA, run)
    ).rejects.toThrow(message);
  });
  it.each([
    `localhost:5000/training-plan:v1.3.0`,
    `localhost:5000/training-plan@${manifest.digest}`,
  ])("сохраняет порт registry и не дублирует digest: %s", async (reference) => {
    const run = vi
      .fn()
      .mockResolvedValueOnce({ stdout: JSON.stringify(manifest) })
      .mockResolvedValueOnce({
        stdout: JSON.stringify({ "linux/amd64": image, "linux/arm64": image }),
      });
    expect(await inspectVersionImage(reference, SHA, run)).toBe(manifest.digest);
    expect(run.mock.calls[1][1]).toContain(`localhost:5000/training-plan@${manifest.digest}`);
  });
  it("не считает отсутствующим образ, потерявший найденный digest", async () => {
    const error = Object.assign(new Error("manifest unknown"), { stderr: "manifest unknown" });
    const run = vi
      .fn()
      .mockResolvedValueOnce({ stdout: JSON.stringify(manifest) })
      .mockRejectedValueOnce(error);
    await expect(
      inspectVersionImage("ghcr.io/raidzer/training-plan:v1.3.0", SHA, run)
    ).rejects.toBe(error);
  });
  it.each(["", "sha256:bad", null])("отклоняет некорректный digest: %s", async (digest) => {
    const run = vi.fn().mockResolvedValueOnce({ stdout: JSON.stringify({ digest }) });
    await expect(
      inspectVersionImage("ghcr.io/raidzer/training-plan:v1.3.0", SHA, run)
    ).rejects.toThrow();
    expect(run).toHaveBeenCalledTimes(1);
  });
  it("отклоняет короткий SHA до обращения к Docker", async () => {
    const run = vi.fn();
    await expect(
      inspectVersionImage("ghcr.io/raidzer/training-plan:v1.3.0", SHA.slice(0, 7), run)
    ).rejects.toThrow();
    expect(run).not.toHaveBeenCalled();
  });
});
