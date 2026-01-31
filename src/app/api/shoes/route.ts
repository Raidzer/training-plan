import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/server/db/client";
import { shoes } from "@/server/db/schema";

type ShoePayload = {
  name?: string;
};

const parseName = (payload: ShoePayload | null) => {
  const raw = typeof payload?.name === "string" ? payload.name.trim() : "";
  if (!raw) {
    return null;
  }
  if (raw.length > 255) {
    return null;
  }
  return raw;
};

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = Number((session.user as { id?: string } | undefined)?.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const items = await db
    .select({
      id: shoes.id,
      name: shoes.name,
      createdAt: shoes.createdAt,
      updatedAt: shoes.updatedAt,
    })
    .from(shoes)
    .where(eq(shoes.userId, userId))
    .orderBy(desc(shoes.updatedAt), desc(shoes.id));

  return NextResponse.json({ shoes: items });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = Number((session.user as { id?: string } | undefined)?.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as ShoePayload | null;
  const name = parseName(body);
  if (!name) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }

  const now = new Date();
  const [created] = await db
    .insert(shoes)
    .values({
      userId,
      name,
      createdAt: now,
      updatedAt: now,
    })
    .returning({
      id: shoes.id,
      name: shoes.name,
      createdAt: shoes.createdAt,
      updatedAt: shoes.updatedAt,
    });

  return NextResponse.json({ shoe: created }, { status: 201 });
}
