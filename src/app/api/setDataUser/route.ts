import { auth } from "@/auth";
import { isSameOriginRequest } from "@/server/requestSecurity";
import { updateUserProfileById } from "@/server/services/users";
import { NextResponse } from "next/server";
import { z } from "zod";

const PROFILE_GENDERS = ["male", "female"] as const;

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

const schema = z
  .object({
    name: z.string().trim().min(1, "Имя обязательно для заполнения").max(255),
    lastName: z
      .string()
      .trim()
      .max(255)
      .nullable()
      .optional()
      .transform((value) => value || null),
    patronymic: z
      .string()
      .trim()
      .max(255)
      .nullable()
      .optional()
      .transform((value) => value || null),
    heightCm: z
      .number()
      .int()
      .min(50)
      .max(250)
      .nullable()
      .optional()
      .transform((value) => value ?? null),
    gender: z.enum(PROFILE_GENDERS),
    timezone: z
      .string()
      .trim()
      .min(1, "Выберите часовой пояс")
      .max(64, "Слишком длинный часовой пояс")
      .refine((val) => isValidTimeZone(val), { message: "Неверный часовой пояс" }),
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
    const body = await req.json().catch(() => null);

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    const { name, lastName, patronymic, heightCm, gender, timezone } = parsed.data;
    const updatedUser = await updateUserProfileById(userId, {
      name,
      lastName,
      patronymic,
      heightCm,
      gender,
      timezone,
    });
    if (!updatedUser) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Профиль успешно обновлён",
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
