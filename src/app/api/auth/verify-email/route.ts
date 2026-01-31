import { NextRequest, NextResponse } from "next/server";
import { getVerificationTokenByToken } from "@/server/tokens";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { deleteVerificationTokenById, getUserByEmail, markEmailVerifiedById } from "@/server/auth";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const token = searchParams.get("token");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  if (!token) {
    return NextResponse.redirect(new URL("/auth/verify-email?error=missing_token", baseUrl));
  }

  const existingToken = await getVerificationTokenByToken(token);

  if (!existingToken) {
    return NextResponse.redirect(new URL("/auth/verify-email?error=invalid_token", baseUrl));
  }

  const hasExpired = new Date(existingToken.expires) < new Date();

  if (hasExpired) {
    return NextResponse.redirect(new URL("/auth/verify-email?error=expired", baseUrl));
  }

  const existingUser = await getUserByEmail(existingToken.identifier);

  if (!existingUser) {
    return NextResponse.redirect(new URL("/auth/verify-email?error=email_not_found", baseUrl));
  }

  await markEmailVerifiedById(existingUser.id);
  await deleteVerificationTokenById(existingToken.id);

  const session = await getServerSession(authOptions);

  if (session) {
    return NextResponse.redirect(new URL("/dashboard?verified=true", baseUrl));
  }

  return NextResponse.redirect(new URL("/login?verified=true", baseUrl));
}
