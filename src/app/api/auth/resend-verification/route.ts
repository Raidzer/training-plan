import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.emailVerified) {
    return NextResponse.json({ error: "Email already verified" }, { status: 400 });
  }

  try {
    const token = await generateVerificationToken(session.user.email);
    await sendVerificationEmail(session.user.email, token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to resend verification email", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
