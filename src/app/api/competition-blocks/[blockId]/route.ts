import { NextResponse } from "next/server";
import { deleteCompetitionBlock, updateCompetitionBlock } from "@/server/competitions";
import { getAuthenticatedCompetitionUserId } from "../competitionAuth";
import {
  parseCompetitionBlockUpdatePayload,
  type CompetitionBlockPayload,
} from "../competitionPayload";

type Params = {
  blockId: string;
};

export async function PATCH(req: Request, { params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  const userId = await getAuthenticatedCompetitionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const blockId = Number(resolvedParams.blockId);
  if (!Number.isFinite(blockId) || blockId <= 0) {
    return NextResponse.json({ error: "invalid_block_id" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as CompetitionBlockPayload | null;
  const parsed = parseCompetitionBlockUpdatePayload(body);
  if (!parsed.valid) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const block = await updateCompetitionBlock({
    userId,
    blockId,
    ...parsed.value,
  });

  if (!block) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ block });
}

export async function DELETE(_req: Request, { params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  const userId = await getAuthenticatedCompetitionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const blockId = Number(resolvedParams.blockId);
  if (!Number.isFinite(blockId) || blockId <= 0) {
    return NextResponse.json({ error: "invalid_block_id" }, { status: 400 });
  }

  const deleted = await deleteCompetitionBlock({ userId, blockId });
  if (!deleted) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
