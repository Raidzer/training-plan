import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";

const schema = z.object({
  login: z
    .string()
    .trim()
    .min(3, "Login must be at least 3 characters")
    .max(64, "Login must be at most 64 characters"),
  name: z.string().min(2, "Имя слишком короткое"),
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные" },
      { status: 400 }
    );
  }

  const { name, email, login, password } = parsed.data;

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      or(
        eq(users.email, email),
        eq(users.login, login),
        eq(users.email, login),
        eq(users.login, email)
      )
    );

  if (existing) {
    return NextResponse.json(
      { error: "Email or login already in use" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [created] = await db
    .insert(users)
    .values({
      email,
      login,
      passwordHash,
      name,
      role: "athlete",
    })
    .returning({ id: users.id, email: users.email, name: users.name });

  return NextResponse.json({ user: created }, { status: 201 });
}
