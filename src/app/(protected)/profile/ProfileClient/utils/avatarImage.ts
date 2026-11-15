import type { Area } from "react-easy-crop";
import {
  AVATAR_OUTPUT_SIZE,
  AVATAR_SOURCE_MAX_BYTES,
  AVATAR_SOURCE_MAX_PIXELS,
  AVATAR_SOURCE_MIME_TYPES,
  AVATAR_UPLOAD_MAX_BYTES,
} from "@/shared/constants/profileAvatar";
import { AVATAR_ERRORS } from "../constants/avatarConstants";
import type { AvatarSource } from "../types/avatarTypes";

export async function loadAvatarImage(file: File): Promise<AvatarSource> {
  if (!AVATAR_SOURCE_MIME_TYPES.some((type) => type === file.type)) {
    throw new Error(AVATAR_ERRORS.format);
  }
  if (file.size === 0) {
    throw new Error(AVATAR_ERRORS.empty);
  }
  if (file.size > AVATAR_SOURCE_MAX_BYTES) {
    throw new Error(AVATAR_ERRORS.size);
  }

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode().catch(() => {
      throw new Error(AVATAR_ERRORS.decode);
    });
    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error(AVATAR_ERRORS.decode);
    }
    if (image.naturalWidth * image.naturalHeight > AVATAR_SOURCE_MAX_PIXELS) {
      throw new Error(AVATAR_ERRORS.pixels);
    }
    return { url, image };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

export async function createAvatarBlob(image: HTMLImageElement, area: Area): Promise<Blob> {
  if (
    ![area.x, area.y, area.width, area.height].every(Number.isFinite) ||
    area.x < 0 ||
    area.y < 0 ||
    area.width <= 0 ||
    area.height <= 0 ||
    area.x + area.width > image.naturalWidth ||
    area.y + area.height > image.naturalHeight
  ) {
    throw new Error(AVATAR_ERRORS.crop);
  }

  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_OUTPUT_SIZE;
  canvas.height = AVATAR_OUTPUT_SIZE;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error(AVATAR_ERRORS.crop);
  }
  const blob = await new Promise<Blob>((resolve, reject) => {
    context.drawImage(
      image,
      area.x,
      area.y,
      area.width,
      area.height,
      0,
      0,
      AVATAR_OUTPUT_SIZE,
      AVATAR_OUTPUT_SIZE
    );
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error(AVATAR_ERRORS.crop));
          return;
        }
        resolve(result);
      },
      "image/webp",
      0.92
    );
  }).catch(() => {
    throw new Error(AVATAR_ERRORS.crop);
  });
  if (blob.type !== "image/webp") {
    throw new Error(AVATAR_ERRORS.webp);
  }
  if (blob.size > AVATAR_UPLOAD_MAX_BYTES) {
    throw new Error(AVATAR_ERRORS.uploadSize);
  }
  return blob;
}
