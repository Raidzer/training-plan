import { auth } from "@/auth";
import { db } from "@/db/client";
import { workouts } from "@/db/schema";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const userId = Number((session.user as any).id ?? 1); // на MVP можно сидировать 1 пользователя

  await db.insert(workouts).values({
    userId,
    date: body.date,
    type: body.type,
    distanceKm: body.distanceKm ? String(body.distanceKm) : null,
    timeSec: body.timeSec ? Number(body.timeSec) : null,
    avgHr: body.avgHr ? Number(body.avgHr) : null,
    rpe: body.rpe ? Number(body.rpe) : null,
    comment: body.comment ?? null,
  });

  return NextResponse.json({ ok: true });
}
