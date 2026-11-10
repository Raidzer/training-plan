import { randomBytes } from "node:crypto";
import { crc32 } from "node:zlib";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { processProfileAvatar, ProfileAvatarError } from "@/server/profileAvatar";

function createImage(width = 512, height = width) {
  return sharp({ create: { width, height, channels: 3, background: "red" } });
}

describe("processProfileAvatar", () => {
  it.each(["jpeg", "png", "webp"] as const)(
    "перекодирует %s в квадратный WebP без метаданных",
    async (format) => {
      const input = await createImage(768)
        .withExif({ IFD0: { Artist: "Private name" } })
        .toFormat(format)
        .toBuffer();
      const output = await processProfileAvatar(input);
      const metadata = await sharp(output).metadata();

      expect(metadata).toMatchObject({ format: "webp", width: 512, height: 512 });
      expect(metadata.exif).toBeUndefined();
      expect(metadata.icc).toBeUndefined();
      expect(metadata.xmp).toBeUndefined();
      expect(output.length).toBeLessThanOrEqual(200 * 1024);
    }
  );

  it("отклоняет неквадратный и слишком большой фрагмент", async () => {
    for (const [width, height] of [
      [512, 300],
      [1025, 1025],
      [2048, 1024],
    ]) {
      const input = await createImage(width, height).png().toBuffer();
      await expect(processProfileAvatar(input)).rejects.toBeInstanceOf(ProfileAvatarError);
    }
  });

  it("отклоняет поддельное содержимое, SVG, GIF и повреждённый PNG", async () => {
    const png = await createImage().png().toBuffer();
    for (const input of [
      Buffer.from("not an image"),
      Buffer.from('<svg width="512" height="512"></svg>'),
      await createImage().gif().toBuffer(),
      png.subarray(0, 60),
    ]) {
      await expect(processProfileAvatar(input)).rejects.toBeInstanceOf(ProfileAvatarError);
    }
  });

  it("отклоняет анимированный WebP", async () => {
    const pixels = Buffer.alloc(32 * 64 * 3);
    pixels.fill(255, 32 * 32 * 3);
    const input = await sharp(pixels, {
      raw: { width: 32, height: 64, pageHeight: 32, channels: 3 },
    })
      .webp({ loop: 0, delay: [100, 100] })
      .toBuffer();
    expect((await sharp(input).metadata()).pages).toBe(2);
    await expect(processProfileAvatar(input)).rejects.toBeInstanceOf(ProfileAvatarError);
  });

  it("отклоняет PNG с блоком управления анимацией, даже если sharp читает лишь первый кадр", async () => {
    const png = await createImage().png().toBuffer();
    const animationChunk = Buffer.alloc(20);
    animationChunk.writeUInt32BE(8, 0);
    animationChunk.write("acTL", 4);
    animationChunk.writeUInt32BE(2, 8);
    animationChunk.writeUInt32BE(crc32(animationChunk.subarray(4, 16)), 16);
    const input = Buffer.concat([png.subarray(0, 33), animationChunk, png.subarray(33)]);
    expect((await sharp(input).metadata()).format).toBe("png");
    await expect(processProfileAvatar(input)).rejects.toBeInstanceOf(ProfileAvatarError);
  });

  it("отклоняет результат больше 200 КиБ", async () => {
    const input = await sharp(randomBytes(512 * 512 * 4), {
      raw: { width: 512, height: 512, channels: 4 },
    })
      .webp()
      .toBuffer();
    expect(input.length).toBeLessThanOrEqual(1024 * 1024);
    await expect(processProfileAvatar(input)).rejects.toMatchObject({ status: 413 });
  });
});
