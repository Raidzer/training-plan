import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { competitionBlocks, competitions } from "@/server/db/schema";
import type { CompetitionPriority } from "@/shared/constants/competitions";

export type CompetitionRecord = {
  id: number;
  blockId: number;
  date: string;
  nameLocation: string;
  distanceMeters: number | null;
  distanceLabel: string;
  priority: CompetitionPriority;
  result: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CompetitionBlockRecord = {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CompetitionBlockWithCompetitions = CompetitionBlockRecord & {
  competitions: CompetitionRecord[];
};

export type CompetitionBlockCreateParams = {
  userId: number;
  title: string;
  startDate: string;
  endDate: string;
};

export type CompetitionBlockUpdateParams = {
  userId: number;
  blockId: number;
  title?: string;
  startDate?: string;
  endDate?: string;
};

export type CompetitionCreateParams = {
  userId: number;
  blockId: number;
  date: string;
  nameLocation: string;
  distanceMeters: number | null;
  distanceLabel: string;
  priority: CompetitionPriority;
  result: string | null;
};

export type CompetitionUpdateParams = {
  userId: number;
  competitionId: number;
  date?: string;
  nameLocation?: string;
  distanceMeters?: number | null;
  distanceLabel?: string;
  priority?: CompetitionPriority;
  result?: string | null;
};

const blockReturningColumns = {
  id: competitionBlocks.id,
  title: competitionBlocks.title,
  startDate: competitionBlocks.startDate,
  endDate: competitionBlocks.endDate,
  sortOrder: competitionBlocks.sortOrder,
  createdAt: competitionBlocks.createdAt,
  updatedAt: competitionBlocks.updatedAt,
};

const competitionReturningColumns = {
  id: competitions.id,
  blockId: competitions.blockId,
  date: competitions.date,
  nameLocation: competitions.nameLocation,
  distanceMeters: competitions.distanceMeters,
  distanceLabel: competitions.distanceLabel,
  priority: competitions.priority,
  result: competitions.result,
  sortOrder: competitions.sortOrder,
  createdAt: competitions.createdAt,
  updatedAt: competitions.updatedAt,
};

type CompetitionSelectRow = {
  id: number;
  blockId: number;
  date: string;
  nameLocation: string;
  distanceMeters: number | null;
  distanceLabel: string;
  priority: string;
  result: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

const normalizeCompetitionRecord = (row: CompetitionSelectRow) =>
  ({
    ...row,
    priority: row.priority as CompetitionPriority,
  }) satisfies CompetitionRecord;

const getNextBlockSortOrder = async (userId: number) => {
  const [row] = await db
    .select({
      sortOrder: sql<number>`coalesce(max(${competitionBlocks.sortOrder}), -1) + 1`,
    })
    .from(competitionBlocks)
    .where(eq(competitionBlocks.userId, userId));

  return Number(row?.sortOrder ?? 0);
};

const getNextCompetitionSortOrder = async (blockId: number) => {
  const [row] = await db
    .select({
      sortOrder: sql<number>`coalesce(max(${competitions.sortOrder}), -1) + 1`,
    })
    .from(competitions)
    .where(eq(competitions.blockId, blockId));

  return Number(row?.sortOrder ?? 0);
};

const getCompetitionForUser = async (params: { userId: number; competitionId: number }) => {
  const [row] = await db
    .select({
      id: competitions.id,
      blockId: competitions.blockId,
    })
    .from(competitions)
    .innerJoin(competitionBlocks, eq(competitionBlocks.id, competitions.blockId))
    .where(
      and(eq(competitions.id, params.competitionId), eq(competitionBlocks.userId, params.userId))
    )
    .limit(1);

  return row ?? null;
};

export async function listCompetitionBlocksByUser(
  userId: number
): Promise<CompetitionBlockWithCompetitions[]> {
  const blockRows = await db
    .select(blockReturningColumns)
    .from(competitionBlocks)
    .where(eq(competitionBlocks.userId, userId))
    .orderBy(
      asc(competitionBlocks.startDate),
      asc(competitionBlocks.sortOrder),
      asc(competitionBlocks.id)
    );

  if (blockRows.length === 0) {
    return [];
  }

  const blockIds = blockRows.map((block) => block.id);
  const competitionRows = await db
    .select(competitionReturningColumns)
    .from(competitions)
    .where(inArray(competitions.blockId, blockIds))
    .orderBy(asc(competitions.date), asc(competitions.sortOrder), asc(competitions.id));

  const competitionsByBlockId = new Map<number, CompetitionRecord[]>();
  for (const row of competitionRows) {
    const item = normalizeCompetitionRecord(row);
    const existing = competitionsByBlockId.get(item.blockId);
    if (existing) {
      existing.push(item);
    } else {
      competitionsByBlockId.set(item.blockId, [item]);
    }
  }

  return blockRows.map((block) => ({
    ...block,
    competitions: competitionsByBlockId.get(block.id) ?? [],
  }));
}

export async function createCompetitionBlock(
  params: CompetitionBlockCreateParams
): Promise<CompetitionBlockWithCompetitions | undefined> {
  const now = new Date();
  const sortOrder = await getNextBlockSortOrder(params.userId);
  const [created] = await db
    .insert(competitionBlocks)
    .values({
      userId: params.userId,
      title: params.title,
      startDate: params.startDate,
      endDate: params.endDate,
      sortOrder,
      createdAt: now,
      updatedAt: now,
    })
    .returning(blockReturningColumns);

  if (!created) {
    return undefined;
  }

  return {
    ...created,
    competitions: [],
  };
}

export async function updateCompetitionBlock(
  params: CompetitionBlockUpdateParams
): Promise<CompetitionBlockWithCompetitions | null> {
  const values: {
    updatedAt: Date;
    title?: string;
    startDate?: string;
    endDate?: string;
  } = {
    updatedAt: new Date(),
  };

  if (params.title !== undefined) {
    values.title = params.title;
  }
  if (params.startDate !== undefined) {
    values.startDate = params.startDate;
  }
  if (params.endDate !== undefined) {
    values.endDate = params.endDate;
  }

  const [updated] = await db
    .update(competitionBlocks)
    .set(values)
    .where(
      and(eq(competitionBlocks.id, params.blockId), eq(competitionBlocks.userId, params.userId))
    )
    .returning(blockReturningColumns);

  if (!updated) {
    return null;
  }

  const competitionRows = await db
    .select(competitionReturningColumns)
    .from(competitions)
    .where(eq(competitions.blockId, updated.id))
    .orderBy(asc(competitions.date), asc(competitions.sortOrder), asc(competitions.id));

  return {
    ...updated,
    competitions: competitionRows.map(normalizeCompetitionRecord),
  };
}

export async function deleteCompetitionBlock(params: {
  userId: number;
  blockId: number;
}): Promise<boolean> {
  const [deleted] = await db
    .delete(competitionBlocks)
    .where(
      and(eq(competitionBlocks.id, params.blockId), eq(competitionBlocks.userId, params.userId))
    )
    .returning({ id: competitionBlocks.id });

  return Boolean(deleted);
}

export async function createCompetition(
  params: CompetitionCreateParams
): Promise<CompetitionRecord | null> {
  const [block] = await db
    .select({ id: competitionBlocks.id })
    .from(competitionBlocks)
    .where(
      and(eq(competitionBlocks.id, params.blockId), eq(competitionBlocks.userId, params.userId))
    )
    .limit(1);

  if (!block) {
    return null;
  }

  const now = new Date();
  const sortOrder = await getNextCompetitionSortOrder(params.blockId);
  const [created] = await db
    .insert(competitions)
    .values({
      blockId: params.blockId,
      date: params.date,
      nameLocation: params.nameLocation,
      distanceMeters: params.distanceMeters,
      distanceLabel: params.distanceLabel,
      priority: params.priority,
      result: params.result,
      sortOrder,
      createdAt: now,
      updatedAt: now,
    })
    .returning(competitionReturningColumns);

  if (!created) {
    return null;
  }

  return normalizeCompetitionRecord(created);
}

export async function updateCompetition(
  params: CompetitionUpdateParams
): Promise<CompetitionRecord | null> {
  const existing = await getCompetitionForUser({
    userId: params.userId,
    competitionId: params.competitionId,
  });

  if (!existing) {
    return null;
  }

  const values: {
    updatedAt: Date;
    date?: string;
    nameLocation?: string;
    distanceMeters?: number | null;
    distanceLabel?: string;
    priority?: CompetitionPriority;
    result?: string | null;
  } = {
    updatedAt: new Date(),
  };

  if (params.date !== undefined) {
    values.date = params.date;
  }
  if (params.nameLocation !== undefined) {
    values.nameLocation = params.nameLocation;
  }
  if (params.distanceMeters !== undefined) {
    values.distanceMeters = params.distanceMeters;
  }
  if (params.distanceLabel !== undefined) {
    values.distanceLabel = params.distanceLabel;
  }
  if (params.priority !== undefined) {
    values.priority = params.priority;
  }
  if (params.result !== undefined) {
    values.result = params.result;
  }

  const [updated] = await db
    .update(competitions)
    .set(values)
    .where(eq(competitions.id, params.competitionId))
    .returning(competitionReturningColumns);

  if (!updated) {
    return null;
  }

  return normalizeCompetitionRecord(updated);
}

export async function deleteCompetition(params: {
  userId: number;
  competitionId: number;
}): Promise<boolean> {
  const existing = await getCompetitionForUser(params);
  if (!existing) {
    return false;
  }

  const [deleted] = await db
    .delete(competitions)
    .where(eq(competitions.id, params.competitionId))
    .returning({ id: competitions.id });

  return Boolean(deleted);
}
