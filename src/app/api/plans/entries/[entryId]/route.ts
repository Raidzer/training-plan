import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { updatePlanEntryText } from "@/server/plans";

type RouteContext = {
  params: Promise<{
    entryId: string;
  }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = Number((session.user as any)?.id);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { entryId: entryIdParam } = await context.params;
  const entryId = Number(entryIdParam);
  if (!Number.isInteger(entryId) || entryId <= 0) {
    return NextResponse.json({ error: "invalid_entry_id" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as {
    taskText?: string;
    commentText?: string | null;
  } | null;

  const taskText = typeof body?.taskText === "string" ? body.taskText.trim() : "";
  if (!taskText) {
    return NextResponse.json({ error: "empty_task" }, { status: 400 });
  }

  const commentTextRaw =
    typeof body?.commentText === "string"
      ? body.commentText.trim()
      : body?.commentText === null
        ? null
        : "";
  const commentText = commentTextRaw ? commentTextRaw : null;

  const updated = await updatePlanEntryText({
    userId,
    entryId,
    taskText,
    commentText,
  });

  if ("error" in updated) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
