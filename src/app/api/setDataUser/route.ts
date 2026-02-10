import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import z from "zod";

const schema = z.object({
  userId: z.number(),
  name: z.string().min(1, "Имя обязательно для заполнения").optional(),
  lastName: z.string().optional(),
  gender: z.string().optional(),
  timezone: z.string().min(1, "Выберите часовой пояс").optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    // Получаем тело запроса
    const body = await req.json();

    // Парсим и валидируем
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
    }

    const { name, lastName, gender, timezone, userId } = parsed.data;

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
      lastName?: string;
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
      updateData.timezone = timezone;
    }

    // Выполняем обновление, если есть что обновлять
    if (Object.keys(updateData).length > 0) {
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
