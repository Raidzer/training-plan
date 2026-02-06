import { NextRequest, NextResponse } from "next/server";
import { generatePasswordResetToken } from "@/server/tokens";
import { sendPasswordResetEmail } from "@/server/email";
import { z } from "zod";
import { getUserByEmail } from "@/server/auth";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);

    const existingUser = await getUserByEmail(email);

    if (!existingUser) {
      return NextResponse.json({ success: true });
    }

    const token = await generatePasswordResetToken(email);
    await sendPasswordResetEmail(email, token);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
