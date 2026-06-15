import { NextResponse } from "next/server";
import { createCompetitionBlock, listCompetitionBlocksByUser } from "@/server/competitions";
import { getAuthenticatedCompetitionUserId } from "./competitionAuth";
import {
  parseCompetitionBlockCreatePayload,
  type CompetitionBlockPayload,
} from "./competitionPayload";

export async function GET() {
  const userId = await getAuthenticatedCompetitionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const blocks = await listCompetitionBlocksByUser(userId);

  return NextResponse.json({ blocks });
}

export async function POST(req: Request) {
  const userId = await getAuthenticatedCompetitionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as CompetitionBlockPayload | null;
  const parsed = parseCompetitionBlockCreatePayload(body);
  if (!parsed.valid) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const block = await createCompetitionBlock({
    userId,
    ...parsed.value,
  });

  return NextResponse.json({ block }, { status: 201 });
}
