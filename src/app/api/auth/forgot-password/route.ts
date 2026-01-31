import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { generatePasswordResetToken } from "@/server/tokens";
import { sendPasswordResetEmail } from "@/server/email";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);

    const [existingUser] = await db.select().from(users).where(eq(users.email, email));

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
