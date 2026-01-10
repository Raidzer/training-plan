import { NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { registrationInvites, users } from "@/db/schema";
import { buildInviteExpiry, generateInviteToken, hashInviteToken } from "@/lib/registrationInvites";

const schema = z.object({
  role: z.enum(["athlete", "coach"]),
});

type InviteStatus = "active" | "used" | "expired";

const getInviteStatus = (
  invite: {
    usedAt: Date | null;
    usedByUserId: number | null;
    expiresAt: Date;
  },
  now: Date
): InviteStatus => {
  if (invite.usedAt || invite.usedByUserId) {
    return "used";
  }
  if (invite.expiresAt <= now) {
    return "expired";
  }
  return "active";
};

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sessionRole = (session.user as { role?: string } | undefined)?.role;
  if (sessionRole !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      id: registrationInvites.id,
      role: registrationInvites.role,
      createdByUserId: registrationInvites.createdByUserId,
      usedByUserId: registrationInvites.usedByUserId,
      createdAt: registrationInvites.createdAt,
      expiresAt: registrationInvites.expiresAt,
      usedAt: registrationInvites.usedAt,
    })
    .from(registrationInvites)
    .orderBy(desc(registrationInvites.createdAt))
    .limit(200);

  const userIds = new Set<number>();
  for (const row of rows) {
    userIds.add(row.createdByUserId);
    if (row.usedByUserId) {
      userIds.add(row.usedByUserId);
    }
  }

  let userRows: { id: number; name: string; email: string }[] = [];
  if (userIds.size > 0) {
    userRows = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(inArray(users.id, Array.from(userIds)));
  }

  const userMap = new Map(
    userRows.map((row) => [row.id, { id: row.id, name: row.name, email: row.email }])
  );

  const now = new Date();
  const invites = rows.map((row) => {
    const createdBy = userMap.get(row.createdByUserId) ?? null;
    let usedBy: { id: number; name: string; email: string } | null = null;
    if (row.usedByUserId) {
      usedBy = userMap.get(row.usedByUserId) ?? null;
    }
    return {
      id: row.id,
      role: row.role,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      usedAt: row.usedAt ? row.usedAt.toISOString() : null,
      status: getInviteStatus(row, now),
      createdBy,
      usedBy,
    };
  });

  return NextResponse.json({ invites });
}

export async function POST(req: Request) {
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

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const token = generateInviteToken();
  const tokenHash = hashInviteToken(token);
  const expiresAt = buildInviteExpiry();

  const [created] = await db
    .insert(registrationInvites)
    .values({
      tokenHash,
      role: parsed.data.role,
      createdByUserId: sessionUserId,
      expiresAt,
    })
    .returning({
      id: registrationInvites.id,
      role: registrationInvites.role,
      createdAt: registrationInvites.createdAt,
      expiresAt: registrationInvites.expiresAt,
    });

  if (!created) {
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }

  const [creator] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, sessionUserId));

  const invite = {
    id: created.id,
    role: created.role,
    createdAt: created.createdAt.toISOString(),
    expiresAt: created.expiresAt.toISOString(),
    usedAt: null as string | null,
    status: "active" as InviteStatus,
    createdBy: creator ?? null,
    usedBy: null as { id: number; name: string; email: string } | null,
  };

  return NextResponse.json({ invite, token });
}
