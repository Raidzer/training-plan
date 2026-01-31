import { NextResponse } from "next/server";
import { z } from "zod";
import { RegisterError, registerUserWithInvite } from "@/server/register";

const schema = z.object({
  login: z
    .string()
    .trim()
    .min(3, "Login must be at least 3 characters")
    .max(64, "Login must be at most 64 characters"),
  name: z.string().min(2, "Имя слишком короткое"),
  lastName: z.string().trim().max(255, "Фамилия слишком длинная").optional(),
  gender: z.enum(["male", "female"], {
    message: "Выберите пол",
  }),
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
  inviteToken: z.string().trim().min(10, "invite-required"),
  timezone: z.string().min(1, "Выберите часовой пояс").optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  const { name, lastName, gender, email, login, password, inviteToken, timezone } = parsed.data;
  const normalizedLastName = lastName?.trim() ?? "";
  const lastNameValue = normalizedLastName.length > 0 ? normalizedLastName : null;

  try {
    const result = await registerUserWithInvite({
      name,
      lastName: lastNameValue,
      gender,
      email,
      login,
      password,
      inviteToken,
      timezone: timezone ?? null,
    });

    try {
      const { generateVerificationToken } = await import("@/server/tokens");
      const { sendVerificationEmail } = await import("@/server/email");

      const token = await generateVerificationToken(result.user.email);
      await sendVerificationEmail(result.user.email, token);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    return NextResponse.json({ user: result.user }, { status: 201 });
  } catch (error) {
    if (error instanceof RegisterError) {
      switch (error.code) {
        case "invite_invalid":
          return NextResponse.json({ error: "invite_invalid" }, { status: 404 });
        case "invite_used":
          return NextResponse.json({ error: "invite_used" }, { status: 409 });
        case "invite_expired":
          return NextResponse.json({ error: "invite_expired" }, { status: 410 });
        case "user_exists":
          return NextResponse.json({ error: "Email or login already in use" }, { status: 409 });
        case "create_failed":
          return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
        default:
          return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
      }
    }

    console.error("Failed to create user", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
