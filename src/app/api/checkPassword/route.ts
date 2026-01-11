import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const schema = z.object({
  userId: z.number(),
  password: z.string().min(6, 'Минимум 6 символов'),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 });
    }

    const { userId, password } = parsed.data;

    let user;

    if (userId) {
      [user] = await db
        .select({
          id: users.id,
          passwordHash: users.passwordHash,
          email: users.email,
          name: users.name,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
    }

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 });
    }

    // Возвращаем успешный ответ (без passwordHash)
    const { passwordHash, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        success: true,
        message: 'Пароль верный',
        user: userWithoutPassword,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Ошибка при проверке пароля:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
