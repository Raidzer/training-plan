import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { issueEmailVerificationCode } from "@/lib/emailVerification";

export async function POST() {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      emailVerifiedAt: users.emailVerifiedAt,
    })
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

  try {
    const result = await issueEmailVerificationCode({
      userId,
      email: user.email,
      name: user.name,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: "retry-later", retryAt: result.retryAt.toISOString() },
        { status: 429 }
      );
    }

    return NextResponse.json({
      ok: true,
      nextResendAt: result.nextResendAt.toISOString(),
      expiresAt: result.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to send verification email", error);
    return NextResponse.json({ error: "send-failed" }, { status: 500 });
  }
}
