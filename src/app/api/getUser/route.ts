import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    // 1. Получаем сессию через ваш auth() helper
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // 2. Получаем полные данные пользователя из базы
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        lastName: users.lastName,
        role: users.role,
        password: users.passwordHash,
        gender: users.gender,
        timezone: users.timezone,
      })
      .from(users)
      .where(eq(users.id, parseInt(session.user.id))) // ID хранится как string в сессии
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    // 3. Возвращаем данные пользователя
    return NextResponse.json({
      user,
      message: "Текущий пользователь получен",
    });
  } catch (error) {
    console.error("Ошибка при получении текущего пользователя:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
