import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { users, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getVerificationTokenByToken } from "@/lib/tokens";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/auth/verify-email?error=missing_token", req.url));
  }

  const existingToken = await getVerificationTokenByToken(token);

  if (!existingToken) {
    return NextResponse.redirect(new URL("/auth/verify-email?error=invalid_token", req.url));
  }

  const hasExpired = new Date(existingToken.expires) < new Date();

  if (hasExpired) {
    return NextResponse.redirect(new URL("/auth/verify-email?error=expired", req.url));
  }

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, existingToken.identifier));

  if (!existingUser) {
    return NextResponse.redirect(new URL("/auth/verify-email?error=email_not_found", req.url));
  }

  await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, existingUser.id));

  await db.delete(verificationTokens).where(eq(verificationTokens.id, existingToken.id));

  const session = await getServerSession(authOptions);

  if (session) {
    return NextResponse.redirect(new URL("/dashboard?verified=true", req.url));
  }

  return NextResponse.redirect(new URL("/login?verified=true", req.url));
}
