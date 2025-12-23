import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { emailVerificationCodes, users } from "@/db/schema";
import { hashEmailVerificationCode } from "@/lib/emailVerification";

const schema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "invalid-code"),
});

export async function POST(req: Request) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid-payload" }, { status: 400 });
  }

  const [user] = await db
    .select({ emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.id, userId));
  if (!user) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
  if (user.emailVerifiedAt) {
    return NextResponse.json(
      { error: "already-verified" },
      { status: 409 }
    );
  }

  const [codeRow] = await db
    .select({
      id: emailVerificationCodes.id,
      codeHash: emailVerificationCodes.codeHash,
      expiresAt: emailVerificationCodes.expiresAt,
      consumedAt: emailVerificationCodes.consumedAt,
    })
    .from(emailVerificationCodes)
    .where(eq(emailVerificationCodes.userId, userId))
    .orderBy(desc(emailVerificationCodes.createdAt))
    .limit(1);

  if (!codeRow) {
    return NextResponse.json({ error: "code-missing" }, { status: 404 });
  }
  if (codeRow.consumedAt) {
    return NextResponse.json({ error: "code-used" }, { status: 409 });
  }

  const now = new Date();
  if (codeRow.expiresAt < now) {
    return NextResponse.json({ error: "code-expired" }, { status: 410 });
  }

  const expectedHash = hashEmailVerificationCode(parsed.data.code, userId);
  if (expectedHash !== codeRow.codeHash) {
    return NextResponse.json({ error: "code-invalid" }, { status: 400 });
  }

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ emailVerifiedAt: now })
      .where(eq(users.id, userId));
    await tx
      .update(emailVerificationCodes)
      .set({ consumedAt: now })
      .where(eq(emailVerificationCodes.id, codeRow.id));
  });

  return NextResponse.json({ ok: true });
}
