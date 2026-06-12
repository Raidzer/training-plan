import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteUserAccountById } from "@/server/adminUsers";
import { isSameOriginRequest } from "@/server/requestSecurity";

type Params = {
  userId: string;
};

export async function DELETE(req: Request, { params }: { params: Promise<Params> }) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

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

  const result = await deleteUserAccountById(userId);
  if ("error" in result) {
    if (result.error === "not_found") {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ error: "forbidden_admin_delete" }, { status: 403 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
