import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/db/client";
import { registrationInvites, users } from "@/db/schema";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { hashInviteToken } from "@/lib/registrationInvites";

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
});

type RegisterErrorCode =
  | "invite_invalid"
  | "invite_used"
  | "invite_expired"
  | "user_exists"
  | "create_failed";

class RegisterError extends Error {
  code: RegisterErrorCode;

  constructor(code: RegisterErrorCode) {
    super(code);
    this.code = code;
  }
}

const throwRegisterError = (code: RegisterErrorCode): never => {
  throw new RegisterError(code);
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  const { name, lastName, gender, email, login, password, inviteToken } = parsed.data;
  const normalizedLastName = lastName?.trim() ?? "";
  const lastNameValue = normalizedLastName.length > 0 ? normalizedLastName : null;

  try {
    const result = await db.transaction(async (tx) => {
      const now = new Date();
      const inviteHash = hashInviteToken(inviteToken);
      const [invite] = await tx
        .select({
          id: registrationInvites.id,
          role: registrationInvites.role,
          usedAt: registrationInvites.usedAt,
          usedByUserId: registrationInvites.usedByUserId,
          expiresAt: registrationInvites.expiresAt,
        })
        .from(registrationInvites)
        .where(eq(registrationInvites.tokenHash, inviteHash))
        .limit(1);

      if (!invite) {
        throwRegisterError("invite_invalid");
      }

      if (invite.usedAt || invite.usedByUserId) {
        throwRegisterError("invite_used");
      }

      if (invite.expiresAt <= now) {
        throwRegisterError("invite_expired");
      }

      const [existing] = await tx
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
        throwRegisterError("user_exists");
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const [created] = await tx
        .insert(users)
        .values({
          email,
          login,
          passwordHash,
          name,
          lastName: lastNameValue,
          gender,
          role: invite.role,
        })
        .returning({ id: users.id, email: users.email, name: users.name });

      if (!created) {
        throwRegisterError("create_failed");
      }

      const [updatedInvite] = await tx
        .update(registrationInvites)
        .set({
          usedAt: now,
          usedByUserId: created.id,
        })
        .where(
          and(
            eq(registrationInvites.id, invite.id),
            isNull(registrationInvites.usedAt),
            isNull(registrationInvites.usedByUserId),
            gt(registrationInvites.expiresAt, now)
          )
        )
        .returning({ id: registrationInvites.id });

      if (!updatedInvite) {
        throwRegisterError("invite_used");
      }

      return { user: created };
    });

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
