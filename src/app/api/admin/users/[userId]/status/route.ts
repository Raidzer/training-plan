import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { updateUserStatusById } from "@/server/adminUsers";

const schema = z.object({
  isActive: z.boolean(),
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

  const sessionUserId = Number((session.user as { id?: string } | undefined)?.id);
  if (!Number.isFinite(sessionUserId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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

  if (!parsed.data.isActive && userId === sessionUserId) {
    return NextResponse.json({ error: "cannot_disable_self" }, { status: 400 });
  }

  const updated = await updateUserStatusById(userId, parsed.data.isActive);

  if (!updated) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ user: updated });
}
