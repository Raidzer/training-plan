import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  ProfileAvatarError,
  processProfileAvatar,
  readProfileAvatarBody,
} from "@/server/profileAvatar";
import { isSameOriginRequest } from "@/server/requestSecurity";
import {
  deleteUserAvatarById,
  getUserAvatarById,
  saveUserAvatar,
} from "@/server/services/userAvatars";
import { AVATAR_SOURCE_MIME_TYPES } from "@/shared/constants/profileAvatar";

export const runtime = "nodejs";

const RESPONSE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: RESPONSE_HEADERS });
}

async function getSessionUserId(): Promise<number | null> {
  const session = await auth();
  const userId = Number(session?.user?.id);
  return Number.isSafeInteger(userId) && userId > 0 ? userId : null;
}

function handleError(error: unknown) {
  if (error instanceof ProfileAvatarError) {
    return errorResponse(error.message, error.status);
  }

  const databaseError = error as { code?: string; cause?: { code?: string } } | null;
  if (databaseError?.code === "23503" || databaseError?.cause?.code === "23503") {
    return errorResponse("Аккаунт больше не существует", 404);
  }

  return errorResponse("Не удалось сохранить изменения. Попробуйте ещё раз", 500);
}

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (userId === null) {
      return errorResponse("unauthorized", 401);
    }

    const avatar = await getUserAvatarById(userId);
    if (!avatar) {
      return errorResponse("Фотография не найдена", 404);
    }

    return new NextResponse(new Uint8Array(avatar.data), {
      headers: { ...RESPONSE_HEADERS, "Content-Type": "image/webp" },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: Request) {
  if (!isSameOriginRequest(request)) {
    return errorResponse("forbidden", 403);
  }

  try {
    const userId = await getSessionUserId();
    if (userId === null) {
      return errorResponse("unauthorized", 401);
    }

    const contentType = request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase();
    if (!AVATAR_SOURCE_MIME_TYPES.some((type) => type === contentType)) {
      return errorResponse("Поддерживаются только фотографии JPEG, PNG и WebP", 415);
    }

    const data = await processProfileAvatar(await readProfileAvatarBody(request));
    const version = await saveUserAvatar(userId, data);
    return NextResponse.json({ version }, { headers: RESPONSE_HEADERS });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) {
    return errorResponse("forbidden", 403);
  }

  try {
    const userId = await getSessionUserId();
    if (userId === null) {
      return errorResponse("unauthorized", 401);
    }

    await deleteUserAvatarById(userId);
    return NextResponse.json({ success: true }, { headers: RESPONSE_HEADERS });
  } catch (error) {
    return handleError(error);
  }
}
