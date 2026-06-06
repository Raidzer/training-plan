import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/auth";
import { sendVerificationEmail } from "@/server/email";
import { isSameOriginRequest } from "@/server/requestSecurity";
import {
  getUserByIdentifier,
  getUserEmailCredentialsById,
  updateUserEmailById,
} from "@/server/services/users";
import {
  deleteVerificationTokensByIdentifierAndType,
  generateVerificationToken,
} from "@/server/tokens";

const schema = z
  .object({
    email: z
      .string()
      .trim()
      .email("Некорректный email")
      .max(255, "Слишком длинный email")
      .transform((value) => value.toLowerCase()),
    currentPassword: z.string().min(1, "Текущий пароль обязателен").max(1024),
  })
  .strict();

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

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

    const { email, currentPassword } = parsed.data;
    const user = await getUserEmailCredentialsById(userId);
    if (!user) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: "invalid_current_password" }, { status: 403 });
    }

    const currentEmail = user.email.toLowerCase();
    if (email === currentEmail) {
      return NextResponse.json({ error: "email_unchanged" }, { status: 400 });
    }

    const existingUser = await getUserByIdentifier(email);
    if (existingUser) {
      return NextResponse.json({ error: "email_conflict" }, { status: 409 });
    }

    let updatedUser;
    try {
      updatedUser = await updateUserEmailById(userId, email);
    } catch (error) {
      if (isUniqueViolation(error)) {
        return NextResponse.json({ error: "email_conflict" }, { status: 409 });
      }
      throw error;
    }

    if (!updatedUser) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    let emailSent = true;
    try {
      await deleteVerificationTokensByIdentifierAndType(user.email, "verify-email");
      await deleteVerificationTokensByIdentifierAndType(email, "verify-email");
      const token = await generateVerificationToken(email);
      await sendVerificationEmail(email, token);
    } catch (error) {
      emailSent = false;
      console.error("Failed to send verification email after email change", error);
    }

    return NextResponse.json(
      {
        success: true,
        emailSent,
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
