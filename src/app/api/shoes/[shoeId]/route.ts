import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/server/db/client";
import { shoes } from "@/server/db/schema";

type Params = {
  shoeId: string;
};

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

export async function PATCH(req: Request, { params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = Number((session.user as { id?: string } | undefined)?.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const shoeId = Number(resolvedParams.shoeId);
  if (!Number.isFinite(shoeId)) {
    return NextResponse.json({ error: "invalid_shoe_id" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as ShoePayload | null;
  const name = parseName(body);
  if (!name) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }

  const now = new Date();
  const [updated] = await db
    .update(shoes)
    .set({ name, updatedAt: now })
    .where(and(eq(shoes.id, shoeId), eq(shoes.userId, userId)))
    .returning({
      id: shoes.id,
      name: shoes.name,
      createdAt: shoes.createdAt,
      updatedAt: shoes.updatedAt,
    });

  if (!updated) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ shoe: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = Number((session.user as { id?: string } | undefined)?.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const shoeId = Number(resolvedParams.shoeId);
  if (!Number.isFinite(shoeId)) {
    return NextResponse.json({ error: "invalid_shoe_id" }, { status: 400 });
  }

  const [deleted] = await db
    .delete(shoes)
    .where(and(eq(shoes.id, shoeId), eq(shoes.userId, userId)))
    .returning({ id: shoes.id });

  if (!deleted) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
