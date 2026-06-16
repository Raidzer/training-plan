import { NextResponse } from "next/server";
import { createCompetition } from "@/server/competitions";
import { getAuthenticatedCompetitionUserId } from "../../competitionAuth";
import { parseCompetitionCreatePayload, type CompetitionPayload } from "../../competitionPayload";

type Params = {
  blockId: string;
};

export async function POST(req: Request, { params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  const userId = await getAuthenticatedCompetitionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const blockId = Number(resolvedParams.blockId);
  if (!Number.isFinite(blockId) || blockId <= 0) {
    return NextResponse.json({ error: "invalid_block_id" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as CompetitionPayload | null;
  const parsed = parseCompetitionCreatePayload(body);
  if (!parsed.valid) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const competition = await createCompetition({
    userId,
    blockId,
    ...parsed.value,
  });

  if (!competition) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ competition }, { status: 201 });
}
