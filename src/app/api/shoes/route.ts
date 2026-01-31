import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createShoe, listShoesByUser } from "@/server/shoes";

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

  const items = await listShoesByUser(userId);

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

  const created = await createShoe({ userId, name });

  return NextResponse.json({ shoe: created }, { status: 201 });
}
