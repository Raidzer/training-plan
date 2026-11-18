import { NextRequest, NextResponse } from "next/server";
import { generatePasswordResetToken } from "@/server/tokens";
import { sendPasswordResetEmail } from "@/server/email";
import { z } from "zod";

const schema = z.object({
  email: z.email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);

    const token = await generatePasswordResetToken(email);
    if (token) {
      try {
        await sendPasswordResetEmail(email, token);
      } catch {
        console.error("Failed to send password reset email");
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
