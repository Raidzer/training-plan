import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { shoes, workoutReportShoes } from "@/server/db/schema";

export type ShoeRecord = {
  id: number;
  name: string;
  isArchived: boolean;
  hasReports: boolean;
  mileageLimitKm: string | null;
  currentMileageKm: string | null;
  notifyOnLimitEmail: boolean;
  notifyOnLimitTelegram: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type ShoeCreateParams = {
  userId: number;
  name: string;
  mileageLimitKm?: number | null;
  currentMileageKm?: number | null;
  notifyOnLimitEmail?: boolean;
  notifyOnLimitTelegram?: boolean;
};

type ShoeUpdateParams = {
  userId: number;
  shoeId: number;
  name?: string;
  isArchived?: boolean;
  mileageLimitKm?: number | null;
  currentMileageKm?: number | null;
  notifyOnLimitEmail?: boolean;
  notifyOnLimitTelegram?: boolean;
};

const shoeReturningColumns = {
  id: shoes.id,
  name: shoes.name,
  isArchived: shoes.isArchived,
  hasReports: sql<boolean>`exists (select 1 from ${workoutReportShoes} where "workout_report_shoes"."shoe_id" = "shoes"."id")`,
  mileageLimitKm: shoes.mileageLimitKm,
  currentMileageKm: shoes.currentMileageKm,
  notifyOnLimitEmail: shoes.notifyOnLimitEmail,
  notifyOnLimitTelegram: shoes.notifyOnLimitTelegram,
  createdAt: shoes.createdAt,
  updatedAt: shoes.updatedAt,
};

export async function listShoesByUser(userId: number): Promise<ShoeRecord[]> {
  return await db
    .select(shoeReturningColumns)
    .from(shoes)
    .where(eq(shoes.userId, userId))
    .orderBy(desc(shoes.updatedAt), desc(shoes.id));
}

export async function createShoe(params: ShoeCreateParams): Promise<ShoeRecord | undefined> {
  const now = new Date();
  const values: {
    userId: number;
    name: string;
    mileageLimitKm?: string | null;
    currentMileageKm?: string | null;
    notifyOnLimitEmail: boolean;
    notifyOnLimitTelegram: boolean;
    createdAt: Date;
    updatedAt: Date;
  } = {
    userId: params.userId,
    name: params.name,
    notifyOnLimitEmail: params.notifyOnLimitEmail ?? false,
    notifyOnLimitTelegram: params.notifyOnLimitTelegram ?? false,
    createdAt: now,
    updatedAt: now,
  };

  if (params.mileageLimitKm !== undefined) {
    values.mileageLimitKm = params.mileageLimitKm === null ? null : String(params.mileageLimitKm);
  }
  if (params.currentMileageKm !== undefined) {
    values.currentMileageKm =
      params.currentMileageKm === null ? null : String(params.currentMileageKm);
  }

  const [created] = await db.insert(shoes).values(values).returning(shoeReturningColumns);

  return created;
}

export async function updateShoe(params: ShoeUpdateParams): Promise<ShoeRecord | null> {
  const now = new Date();
  const values: {
    updatedAt: Date;
    name?: string;
    isArchived?: boolean;
    mileageLimitKm?: string | null;
    currentMileageKm?: string | null;
    notifyOnLimitEmail?: boolean;
    notifyOnLimitTelegram?: boolean;
  } = { updatedAt: now };

  if (params.name !== undefined) {
    values.name = params.name;
  }
  if (params.isArchived !== undefined) {
    values.isArchived = params.isArchived;
  }
  if (params.mileageLimitKm !== undefined) {
    values.mileageLimitKm = params.mileageLimitKm === null ? null : String(params.mileageLimitKm);
  }
  if (params.currentMileageKm !== undefined) {
    values.currentMileageKm =
      params.currentMileageKm === null ? null : String(params.currentMileageKm);
  }
  if (params.notifyOnLimitEmail !== undefined) {
    values.notifyOnLimitEmail = params.notifyOnLimitEmail;
  }
  if (params.notifyOnLimitTelegram !== undefined) {
    values.notifyOnLimitTelegram = params.notifyOnLimitTelegram;
  }

  const [updated] = await db
    .update(shoes)
    .set(values)
    .where(and(eq(shoes.id, params.shoeId), eq(shoes.userId, params.userId)))
    .returning(shoeReturningColumns);

  if (!updated) {
    return null;
  }

  return updated;
}

export async function deleteShoe(params: {
  userId: number;
  shoeId: number;
}): Promise<"deleted" | "not_found" | "in_use"> {
  return await db.transaction(async (tx) => {
    const condition = and(eq(shoes.id, params.shoeId), eq(shoes.userId, params.userId));
    const [shoe] = await tx.select({ id: shoes.id }).from(shoes).where(condition).for("update");
    if (!shoe) {
      return "not_found";
    }

    const [usage] = await tx
      .select({ id: workoutReportShoes.id })
      .from(workoutReportShoes)
      .where(eq(workoutReportShoes.shoeId, shoe.id))
      .limit(1);
    if (usage) {
      return "in_use";
    }

    await tx.delete(shoes).where(condition);
    return "deleted";
  });
}
