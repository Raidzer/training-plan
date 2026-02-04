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
    console.log("========== НАЧАЛО ОБРАБОТКИ ЗАПРОСА ==========");

    // Получаем тело запроса
    const body = await req.json();
    console.log("Тело запроса:", body);

    // Парсим и валидируем
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      console.log("❌ Ошибка валидации:", JSON.stringify(parsed.error.format(), null, 2));
      return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
    }

    const { name, lastName, gender, timezone, userId } = parsed.data;
    console.log("✅ Распарсенные данные:", {
      userId,
      name: name !== undefined ? `"${name}"` : "undefined",
      lastName: lastName !== undefined ? `"${lastName}"` : "undefined",
      gender: gender !== undefined ? `"${gender}"` : "undefined",
      timezone: timezone !== undefined ? `"${timezone}"` : "undefined",
    });

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

    console.log("👤 Текущие данные пользователя:", existingUser);

    if (!existingUser) {
      console.log("❌ Пользователь не найден");
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    // Создаем объект для обновления
    const updateData: {
      name?: string;
      lastName?: string;
      gender?: string | null;
      timezone?: string | null;
    } = {};

    // Добавляем только те поля, которые были переданы
    if (name !== undefined) {
      updateData.name = name;
      console.log(`✅ Добавляем name: "${name}"`);
    }
    if (lastName !== undefined) {
      updateData.lastName = lastName;
      console.log(`✅ Добавляем lastName: "${lastName}"`);
    }

    if (gender !== undefined) {
      updateData.gender = gender || null;
      console.log(`✅ Добавляем gender: ${gender || "null"}`);
    }

    if (timezone !== undefined) {
      updateData.timezone = timezone || null;
    }
    console.log("📝 Объект для обновления:", updateData);
    console.log("🔢 Количество полей для обновления:", Object.keys(updateData).length);

    // Выполняем обновление, если есть что обновлять
    if (Object.keys(updateData).length > 0) {
      console.log("🔄 Выполняем обновление в базе данных...");
      const result = await db.update(users).set(updateData).where(eq(users.id, userId));
      console.log("✅ Обновление выполнено");
    } else {
      console.log("⚠️ Нет данных для обновления");
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

    console.log("🆕 Обновленные данные пользователя:", updatedUser);
    console.log("========== КОНЕЦ ОБРАБОТКИ ЗАПРОСА ==========");

    return NextResponse.json(
      {
        success: true,
        message: "Профиль успешно обновлён",
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Ошибка при обновлении профиля:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
