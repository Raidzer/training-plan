import { and, eq, gt, isNull, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/server/db/client";
import { registrationInvites, users } from "@/server/db/schema";
import { hashInviteToken } from "@/server/registrationInvites";

export type RegisterErrorCode =
  | "invite_invalid"
  | "invite_used"
  | "invite_expired"
  | "user_exists"
  | "create_failed";

export class RegisterError extends Error {
  code: RegisterErrorCode;

  constructor(code: RegisterErrorCode) {
    super(code);
    this.code = code;
  }
}

const throwRegisterError = (code: RegisterErrorCode): never => {
  throw new RegisterError(code);
};

type RegisterInput = {
  login: string;
  name: string;
  lastName: string | null;
  gender: "male" | "female";
  email: string;
  password: string;
  inviteToken: string;
  timezone?: string | null;
};

type RegisterResult = {
  user: {
    id: number;
    email: string;
    name: string;
  };
};

export async function registerUserWithInvite(input: RegisterInput): Promise<RegisterResult> {
  return await db.transaction(async (tx) => {
    const now = new Date();
    const inviteHash = hashInviteToken(input.inviteToken);
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
          eq(users.email, input.email),
          eq(users.login, input.login),
          eq(users.email, input.login),
          eq(users.login, input.email)
        )
      );

    if (existing) {
      throwRegisterError("user_exists");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const [created] = await tx
      .insert(users)
      .values({
        email: input.email,
        login: input.login,
        passwordHash,
        name: input.name,
        lastName: input.lastName,
        gender: input.gender,
        role: invite.role,
        timezone: input.timezone ?? "Europe/Moscow",
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
}
