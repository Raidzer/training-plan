import { NextRequest, NextResponse } from "next/server";
import { getVerificationTokenByToken } from "@/server/tokens";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { deleteVerificationTokenById, getUserByEmail, updateUserPasswordById } from "@/server/auth";

const schema = z.object({
  token: z.string(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = schema.parse(body);

    const existingToken = await getVerificationTokenByToken(token);

    if (!existingToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const hasExpired = new Date(existingToken.expires) < new Date();

    if (hasExpired) {
      return NextResponse.json({ error: "Token has expired" }, { status: 400 });
    }

    const existingUser = await getUserByEmail(existingToken.identifier);

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await updateUserPasswordById(existingUser.id, hashedPassword);
    await deleteVerificationTokenById(existingToken.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
