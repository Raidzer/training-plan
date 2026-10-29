import { randomUUID } from "node:crypto";
import { and, asc, eq, getTableColumns, lt, sql } from "drizzle-orm";
import type { CompetitionRecord } from "@/server/competitions";
import { db } from "@/server/db/client";
import {
  competitionBlocks,
  competitionResultRequests,
  competitions,
  telegramAccounts,
  telegramSubscriptions,
  users,
} from "@/server/db/schema";
import { improvePersonalRecord } from "@/server/personalRecords";
import {
  getPersonalRecordDistanceKey,
  parsePersonalRecordTime,
} from "@/shared/utils/personalRecordUtils";

const SEND_LEASE_MS = 5 * 60 * 1000;
type RequestRow = typeof competitionResultRequests.$inferSelect;
type CompetitionRow = typeof competitions.$inferSelect;
type Database = Pick<typeof db, "select" | "insert" | "update">;
type RequestParams = { requestId: number; chatId: number };
type DueParams = { userId: number; chatId: number; date: string };

export type CompetitionResultRequest = {
  id: number;
  userId: number;
  chatId: number;
  competition: CompetitionRecord;
  promptMessageId: number | null;
  sentAt: Date | null;
  savedResult: string | null;
};

export type CompetitionResultRequestClaim = {
  id: number;
  leaseToken: string;
  competition: CompetitionRecord;
};

const normalizeCompetition = (row: CompetitionRow): CompetitionRecord => ({
  ...row,
  priority: row.priority as CompetitionRecord["priority"],
});

const isPending = (competition: CompetitionRow) =>
  !competition.isSkipped && !competition.result?.trim();

const emptyResultCondition = () =>
  and(eq(competitions.isSkipped, false), sql`nullif(btrim(${competitions.result}), '') is null`);

const dueCondition = (params: DueParams) =>
  and(
    eq(competitionBlocks.userId, params.userId),
    eq(competitions.date, params.date),
    eq(users.isActive, true),
    eq(telegramAccounts.chatId, params.chatId),
    eq(telegramSubscriptions.chatId, params.chatId),
    eq(telegramSubscriptions.enabled, true),
    sql`${telegramSubscriptions.sendTime} is not null`,
    emptyResultCondition()
  );

const createResultSnapshot = (competition: CompetitionRow) => ({
  date: competition.date,
  nameLocation: competition.nameLocation,
  distanceMeters: competition.distanceMeters,
  distanceLabel: competition.distanceLabel,
  result: competition.result,
  updatedAt: competition.updatedAt.toISOString(),
});

const snapshotMatches = (request: RequestRow, competition: CompetitionRow) => {
  const snapshot = request.resultSnapshot;
  return (
    snapshot !== null &&
    snapshot.date === competition.date &&
    snapshot.nameLocation === competition.nameLocation &&
    snapshot.distanceMeters === competition.distanceMeters &&
    snapshot.distanceLabel === competition.distanceLabel &&
    snapshot.result === competition.result &&
    snapshot.updatedAt === competition.updatedAt.toISOString() &&
    !competition.isSkipped
  );
};

const toRequest = (request: RequestRow, competition: CompetitionRow): CompetitionResultRequest => ({
  id: request.id,
  userId: request.userId,
  chatId: request.chatId,
  competition: normalizeCompetition(competition),
  promptMessageId: request.promptMessageId,
  sentAt: request.sentAt,
  savedResult: request.resultSnapshot?.result ?? null,
});

async function getContext(database: Database, params: RequestParams, lock = false) {
  const query = database
    .select({ request: competitionResultRequests, competition: competitions })
    .from(competitionResultRequests)
    .innerJoin(competitions, eq(competitions.id, competitionResultRequests.competitionId))
    .innerJoin(competitionBlocks, eq(competitionBlocks.id, competitions.blockId))
    .innerJoin(users, eq(users.id, competitionResultRequests.userId))
    .innerJoin(telegramAccounts, eq(telegramAccounts.userId, users.id))
    .where(
      and(
        eq(competitionResultRequests.id, params.requestId),
        eq(competitionResultRequests.chatId, params.chatId),
        eq(competitionBlocks.userId, competitionResultRequests.userId),
        eq(competitions.date, competitionResultRequests.competitionDate),
        eq(users.isActive, true),
        eq(telegramAccounts.id, competitionResultRequests.telegramAccountId),
        eq(telegramAccounts.chatId, params.chatId),
        sql`${competitionResultRequests.sentAt} is not null`
      )
    );
  const [context] = await (lock
    ? query.for("update", {
        of: [competitionResultRequests, competitions, competitionBlocks, telegramAccounts, users],
      })
    : query);
  if (!context || !snapshotMatches(context.request, context.competition)) {
    return null;
  }
  return context;
}

export async function listDueCompetitions(params: DueParams): Promise<CompetitionRecord[]> {
  const rows = await db
    .select(getTableColumns(competitions))
    .from(competitions)
    .innerJoin(competitionBlocks, eq(competitionBlocks.id, competitions.blockId))
    .innerJoin(users, eq(users.id, competitionBlocks.userId))
    .innerJoin(telegramAccounts, eq(telegramAccounts.userId, users.id))
    .innerJoin(telegramSubscriptions, eq(telegramSubscriptions.userId, users.id))
    .where(dueCondition(params))
    .orderBy(asc(competitions.sortOrder), asc(competitions.id));
  return rows.map(normalizeCompetition);
}

export async function claimCompetitionResultRequest(
  params: DueParams & { competitionId: number }
): Promise<CompetitionResultRequestClaim | null> {
  return db.transaction(async (tx) => {
    const [source] = await tx
      .select({ competition: competitions, telegramAccountId: telegramAccounts.id })
      .from(competitions)
      .innerJoin(competitionBlocks, eq(competitionBlocks.id, competitions.blockId))
      .innerJoin(users, eq(users.id, competitionBlocks.userId))
      .innerJoin(telegramAccounts, eq(telegramAccounts.userId, users.id))
      .innerJoin(telegramSubscriptions, eq(telegramSubscriptions.userId, users.id))
      .where(and(dueCondition(params), eq(competitions.id, params.competitionId)))
      .for("update", {
        of: [competitions, competitionBlocks, telegramAccounts, telegramSubscriptions, users],
      });
    if (!source) {
      return null;
    }
    const now = new Date();
    const claim = {
      userId: params.userId,
      chatId: params.chatId,
      telegramAccountId: source.telegramAccountId,
      resultSnapshot: createResultSnapshot(source.competition),
      leaseToken: randomUUID(),
      leaseExpiresAt: new Date(now.getTime() + SEND_LEASE_MS),
    };
    const [request] = await tx
      .insert(competitionResultRequests)
      .values({ ...claim, competitionId: params.competitionId, competitionDate: params.date })
      .onConflictDoUpdate({
        target: [
          competitionResultRequests.competitionId,
          competitionResultRequests.competitionDate,
        ],
        set: claim,
        setWhere: sql`${competitionResultRequests.sentAt} is null and (${competitionResultRequests.leaseExpiresAt} is null or ${lt(competitionResultRequests.leaseExpiresAt, now)})`,
      })
      .returning({
        id: competitionResultRequests.id,
        leaseToken: competitionResultRequests.leaseToken,
      });
    if (!request?.leaseToken) {
      return null;
    }
    return {
      id: request.id,
      leaseToken: request.leaseToken,
      competition: normalizeCompetition(source.competition),
    };
  });
}

export async function markCompetitionResultRequestSent(params: {
  requestId: number;
  leaseToken: string;
}): Promise<boolean> {
  const rows = await db
    .update(competitionResultRequests)
    .set({ sentAt: new Date(), leaseToken: null, leaseExpiresAt: null })
    .where(
      and(
        eq(competitionResultRequests.id, params.requestId),
        eq(competitionResultRequests.leaseToken, params.leaseToken)
      )
    )
    .returning({ id: competitionResultRequests.id });
  return rows.length > 0;
}

export async function releaseCompetitionResultRequestClaim(params: {
  requestId: number;
  leaseToken: string;
}): Promise<void> {
  await db
    .update(competitionResultRequests)
    .set({ leaseToken: null, leaseExpiresAt: null })
    .where(
      and(
        eq(competitionResultRequests.id, params.requestId),
        eq(competitionResultRequests.leaseToken, params.leaseToken)
      )
    );
}

export async function getCompetitionResultRequest(
  params: RequestParams
): Promise<CompetitionResultRequest | null> {
  const context = await getContext(db, params);
  return context ? toRequest(context.request, context.competition) : null;
}

export async function findCompetitionResultRequestByPrompt(params: {
  chatId: number;
  promptMessageId: number;
}): Promise<{ id: number; request: CompetitionResultRequest | null } | null> {
  const [row] = await db
    .select({ id: competitionResultRequests.id })
    .from(competitionResultRequests)
    .where(
      and(
        eq(competitionResultRequests.chatId, params.chatId),
        eq(competitionResultRequests.promptMessageId, params.promptMessageId)
      )
    )
    .limit(1);
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    request: await getCompetitionResultRequest({ requestId: row.id, chatId: params.chatId }),
  };
}

export async function setCompetitionResultPrompt(
  params: RequestParams & { promptMessageId: number }
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const context = await getContext(tx, params, true);
    if (!context || !isPending(context.competition)) {
      return false;
    }
    const rows = await tx
      .update(competitionResultRequests)
      .set({ promptMessageId: params.promptMessageId })
      .where(eq(competitionResultRequests.id, params.requestId))
      .returning({ id: competitionResultRequests.id });
    return rows.length > 0;
  });
}

export async function skipCompetitionResult(
  params: RequestParams
): Promise<CompetitionRecord | null> {
  return db.transaction(async (tx) => {
    const context = await getContext(tx, params, true);
    if (!context || !isPending(context.competition)) {
      return null;
    }
    const [competition] = await tx
      .update(competitions)
      .set({ isSkipped: true, updatedAt: new Date() })
      .where(
        and(
          eq(competitions.id, context.competition.id),
          eq(competitions.date, context.request.competitionDate),
          emptyResultCondition()
        )
      )
      .returning();
    return competition ? normalizeCompetition(competition) : null;
  });
}

export async function saveCompetitionResult(
  params: RequestParams & { result: string }
): Promise<CompetitionResultRequest | null> {
  const time = parsePersonalRecordTime(params.result);
  if (!time) {
    throw new Error("invalid_time");
  }
  return db.transaction(async (tx) => {
    const context = await getContext(tx, params, true);
    if (!context || !isPending(context.competition)) {
      return null;
    }
    const [competition] = await tx
      .update(competitions)
      .set({ result: time.timeText, updatedAt: new Date() })
      .where(
        and(
          eq(competitions.id, context.competition.id),
          eq(competitions.date, context.request.competitionDate),
          emptyResultCondition()
        )
      )
      .returning();
    if (!competition) {
      return null;
    }
    const resultSnapshot = createResultSnapshot(competition);
    await tx
      .update(competitionResultRequests)
      .set({ resultSnapshot })
      .where(eq(competitionResultRequests.id, params.requestId));
    return toRequest({ ...context.request, resultSnapshot }, competition);
  });
}

export async function confirmCompetitionResultRecord(
  params: RequestParams
): Promise<"updated" | "not_better" | "conflict" | "invalid_current_record" | "stale"> {
  return db.transaction(async (tx) => {
    const context = await getContext(tx, params, true);
    if (!context?.request.resultSnapshot?.result?.trim()) {
      return "stale";
    }
    const distanceKey = getPersonalRecordDistanceKey(context.competition.distanceLabel);
    if (!distanceKey) {
      return "stale";
    }
    return improvePersonalRecord(
      {
        userId: context.request.userId,
        record: {
          distanceKey,
          timeText: context.competition.result,
          recordDate: context.competition.date,
          raceName: context.competition.nameLocation,
          raceCity: null,
          protocolUrl: null,
        },
      },
      tx
    );
  });
}
