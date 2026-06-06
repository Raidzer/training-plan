import { NextResponse } from "next/server";
import { getUserPasswordHashById, updateUserPasswordHashById } from "@/server/services/users";
import { isSameOriginRequest } from "@/server/requestSecurity";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Текущий пароль обязателен").max(1024),
    newPassword: z.string().min(6, "Минимум 6 символов").max(128),
    confirmPassword: z.string().min(6, "Минимум 6 символов").max(128),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Новые пароли не совпадают",
    path: ["confirmPassword"],
  })
  .strict();

export async function PATCH(req: Request) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = Number((session.user as { id?: string } | undefined)?.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));

    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await getUserPasswordHashById(userId);
    if (!user) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: "invalid_current_password" }, { status: 403 });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    const updatedUser = await updateUserPasswordHashById(userId, newPasswordHash);
    if (!updatedUser) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Пароль успешно изменён",
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
