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
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
  inviteToken: z.string().trim().min(10, "invite-required"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные" },
      { status: 400 }
    );
  }

  const { name, email, login, password, inviteToken } = parsed.data;

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
      return { error: "invite_invalid" as const };
    }

    if (invite.usedAt || invite.usedByUserId) {
      return { error: "invite_used" as const };
    }

    if (invite.expiresAt <= now) {
      return { error: "invite_expired" as const };
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
      return { error: "user_exists" as const };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [created] = await tx
      .insert(users)
      .values({
        email,
        login,
        passwordHash,
        name,
        role: invite.role,
      })
      .returning({ id: users.id, email: users.email, name: users.name });

    if (!created) {
      return { error: "create_failed" as const };
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
      return { error: "invite_used" as const };
    }

    return { user: created };
  });

  if ("error" in result) {
    switch (result.error) {
      case "invite_invalid":
        return NextResponse.json({ error: "invite_invalid" }, { status: 404 });
      case "invite_used":
        return NextResponse.json({ error: "invite_used" }, { status: 409 });
      case "invite_expired":
        return NextResponse.json({ error: "invite_expired" }, { status: 410 });
      case "user_exists":
        return NextResponse.json(
          { error: "Email or login already in use" },
          { status: 409 }
        );
      case "create_failed":
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      default:
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
    }
  }

  return NextResponse.json({ user: result.user }, { status: 201 });
}
