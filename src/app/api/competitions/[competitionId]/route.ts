import { NextResponse } from "next/server";
import { deleteCompetition, updateCompetition } from "@/server/competitions";
import { getAuthenticatedCompetitionUserId } from "../../competition-blocks/competitionAuth";
import {
  parseCompetitionUpdatePayload,
  type CompetitionPayload,
} from "../../competition-blocks/competitionPayload";

type Params = {
  competitionId: string;
};

export async function PATCH(req: Request, { params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  const userId = await getAuthenticatedCompetitionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const competitionId = Number(resolvedParams.competitionId);
  if (!Number.isFinite(competitionId) || competitionId <= 0) {
    return NextResponse.json({ error: "invalid_competition_id" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as CompetitionPayload | null;
  const parsed = parseCompetitionUpdatePayload(body);
  if (!parsed.valid) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const competition = await updateCompetition({
    userId,
    competitionId,
    ...parsed.value,
  });

  if (!competition) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ competition });
}

export async function DELETE(_req: Request, { params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  const userId = await getAuthenticatedCompetitionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const competitionId = Number(resolvedParams.competitionId);
  if (!Number.isFinite(competitionId) || competitionId <= 0) {
    return NextResponse.json({ error: "invalid_competition_id" }, { status: 400 });
  }

  const deleted = await deleteCompetition({ userId, competitionId });
  if (!deleted) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
