import sharp from "sharp";
import {
  AVATAR_OUTPUT_MAX_BYTES,
  AVATAR_OUTPUT_SIZE,
  AVATAR_UPLOAD_MAX_BYTES,
  AVATAR_UPLOAD_MAX_DIMENSION,
} from "@/shared/constants/profileAvatar";

export class ProfileAvatarError extends Error {
  constructor(
    message: string,
    public readonly status = 400
  ) {
    super(message);
  }
}

function hasPngAnimation(data: Buffer): boolean {
  // libvips читает APNG как обычный PNG, поэтому проверяем управляющий блок анимации.
  for (let offset = 8; offset + 12 <= data.length;) {
    const chunkLength = data.readUInt32BE(offset);
    if (data.toString("ascii", offset + 4, offset + 8) === "acTL") {
      return true;
    }

    offset += chunkLength + 12;
  }

  return false;
}

export async function readProfileAvatarBody(request: Request): Promise<Buffer> {
  if (!request.body) {
    throw new ProfileAvatarError("Выберите фотографию для загрузки");
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      size += value.byteLength;
      if (size > AVATAR_UPLOAD_MAX_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw new ProfileAvatarError("Размер загружаемого фрагмента превышает 1 МиБ", 413);
      }

      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof ProfileAvatarError) {
      throw error;
    }

    throw new ProfileAvatarError("Не удалось прочитать загруженную фотографию");
  } finally {
    reader.releaseLock();
  }

  if (size === 0) {
    throw new ProfileAvatarError("Выберите фотографию для загрузки");
  }

  return Buffer.concat(chunks, size);
}

export async function processProfileAvatar(data: Buffer): Promise<Buffer> {
  try {
    const image = sharp(data, {
      limitInputPixels: AVATAR_UPLOAD_MAX_DIMENSION ** 2,
      failOn: "warning",
    });
    const metadata = await image.metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format)) {
      throw new ProfileAvatarError("Поддерживаются только фотографии JPEG, PNG и WebP");
    }

    if ((metadata.pages ?? 1) !== 1 || (metadata.format === "png" && hasPngAnimation(data))) {
      throw new ProfileAvatarError("Анимированные изображения не поддерживаются");
    }

    if (
      metadata.width !== metadata.height ||
      metadata.width > AVATAR_UPLOAD_MAX_DIMENSION ||
      metadata.height > AVATAR_UPLOAD_MAX_DIMENSION
    ) {
      throw new ProfileAvatarError("Нужен квадратный фрагмент размером не больше 1024 × 1024");
    }

    const output = await image
      .autoOrient()
      .resize(AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE)
      .webp({ quality: 80 })
      .toBuffer();
    if (output.byteLength > AVATAR_OUTPUT_MAX_BYTES) {
      throw new ProfileAvatarError("Обработанная фотография превышает 200 КиБ", 413);
    }

    return output;
  } catch (error) {
    if (error instanceof ProfileAvatarError) {
      throw error;
    }

    throw new ProfileAvatarError("Не удалось обработать фотографию. Выберите другой файл");
  }
}
