import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { planEntries } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const userId = Number((session.user as any)?.id);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const entries = await db
    .select({
      id: planEntries.id,
      date: planEntries.date,
      sessionOrder: planEntries.sessionOrder,
      taskText: planEntries.taskText,
      commentText: planEntries.commentText,
      importId: planEntries.importId,
    })
    .from(planEntries)
    .where(eq(planEntries.userId, userId))
    .orderBy(asc(planEntries.date), asc(planEntries.sessionOrder))
    .limit(500);

  return NextResponse.json({ entries });
}
