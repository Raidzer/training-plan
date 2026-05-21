import { auth } from "@/auth";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import z from "zod";

const isValidTimeZone = (timezone: string): boolean => {
  try {
    return Intl.supportedValuesOf("timeZone").includes(timezone);
  } catch {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }
};

const schema = z.object({
  userId: z.number(),
  name: z.string().min(1, "Имя обязательно для заполнения").optional(),
  lastName: z.string().optional().nullable(),
  gender: z.string().optional(),
  timezone: z
    .string()
    .min(1, "Выберите часовой пояс")
    .refine((val) => isValidTimeZone(val), { message: "Неверный часовой пояс" })
    .optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = Number((session.user as { id?: string } | undefined)?.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    // Получаем тело запроса
    const body = await req.json();

    // Парсим и валидируем
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return NextResponse.json({ error: "Некорректные данные", errors }, { status: 400 });
    }

    const { name, lastName, gender, timezone } = parsed.data;

    // Проверяем существование пользователя
    const [existingUser] = await db
      .select({
        id: users.id,
        currentName: users.name,
        currentLastName: users.lastName,
        currentGender: users.gender,
        currentTimezone: users.timezone,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existingUser) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    // Создаем объект для обновления
    const updateData: {
      name?: string;
      lastName?: string | null;
      gender?: string;
      timezone?: string;
    } = {};

    // Добавляем только те поля, которые были переданы
    if (name !== undefined) {
      updateData.name = name;
    }
    if (lastName !== undefined) {
      updateData.lastName = lastName;
    }

    if (gender !== undefined) {
      updateData.gender = gender;
    }

    if (timezone !== undefined) {
      if (!isValidTimeZone(timezone)) {
        return NextResponse.json({ error: "Неверный часовой пояс" }, { status: 400 });
      }
      updateData.timezone = timezone;
    }

    // Выполняем обновление, если есть что обновлять
    if (Object.keys(updateData).length > 0) {
      if (!session) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
      await db.update(users).set(updateData).where(eq(users.id, userId));
    }

    // Получаем обновленные данные
    const [updatedUser] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        lastName: users.lastName,
        gender: users.gender,
        timezone: users.timezone,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return NextResponse.json(
      {
        success: true,
        message: "Профиль успешно обновлён",
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
