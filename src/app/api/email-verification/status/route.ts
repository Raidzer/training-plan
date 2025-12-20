import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { emailVerificationCodes, users } from "@/db/schema";

export async function GET() {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select({
      email: users.email,
      emailVerifiedAt: users.emailVerifiedAt,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  const [codeRow] = await db
    .select({
      nextResendAt: emailVerificationCodes.nextResendAt,
      expiresAt: emailVerificationCodes.expiresAt,
    })
    .from(emailVerificationCodes)
    .where(eq(emailVerificationCodes.userId, userId))
    .orderBy(desc(emailVerificationCodes.createdAt))
    .limit(1);

  return NextResponse.json({
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt,
    nextResendAt: codeRow?.nextResendAt ?? null,
    codeExpiresAt: codeRow?.expiresAt ?? null,
  });
}
