import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";

const schema = z.object({
  password: z.string().min(6),
});

type Params = {
  userId: string;
};

export async function PATCH(req: Request, { params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sessionRole = (session.user as { role?: string } | undefined)?.role;
  if (sessionRole !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const userId = Number(resolvedParams.userId);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "invalid_user_id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const [updated] = await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, userId))
    .returning({ id: users.id });

  if (!updated) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
