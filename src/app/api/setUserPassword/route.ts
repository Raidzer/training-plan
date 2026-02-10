import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";

import z from "zod";
import bcrypt from "bcryptjs";

const schema = z
  .object({
    userId: z.number(),
    newPassword: z.string().min(6, "Минимум 6 символов"),
    confirmPassword: z.string().min(6, "Минимум 6 символов"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Новые пароли не совпадают",
    path: ["confirmPassword"],
  });

export async function PATCH(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
    }

    const { newPassword, userId } = parsed.data;

    let user;

    if (userId) {
      [user] = await db
        .select({
          id: users.id,
          passwordHash: users.passwordHash,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
    }

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
      })
      .where(eq(users.id, userId));

    const { passwordHash, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        success: true,
        message: "Пароль успешно изменён",
        user: userWithoutPassword,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Ошибка при изменении пароля:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
