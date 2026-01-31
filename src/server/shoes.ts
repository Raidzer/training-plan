import { and, desc, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { shoes } from "@/server/db/schema";

export type ShoeRecord = {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function listShoesByUser(userId: number): Promise<ShoeRecord[]> {
  return await db
    .select({
      id: shoes.id,
      name: shoes.name,
      createdAt: shoes.createdAt,
      updatedAt: shoes.updatedAt,
    })
    .from(shoes)
    .where(eq(shoes.userId, userId))
    .orderBy(desc(shoes.updatedAt), desc(shoes.id));
}

export async function createShoe(params: {
  userId: number;
  name: string;
}): Promise<ShoeRecord | undefined> {
  const now = new Date();
  const [created] = await db
    .insert(shoes)
    .values({
      userId: params.userId,
      name: params.name,
      createdAt: now,
      updatedAt: now,
    })
    .returning({
      id: shoes.id,
      name: shoes.name,
      createdAt: shoes.createdAt,
      updatedAt: shoes.updatedAt,
    });

  return created;
}

export async function updateShoe(params: {
  userId: number;
  shoeId: number;
  name: string;
}): Promise<ShoeRecord | null> {
  const now = new Date();
  const [updated] = await db
    .update(shoes)
    .set({ name: params.name, updatedAt: now })
    .where(and(eq(shoes.id, params.shoeId), eq(shoes.userId, params.userId)))
    .returning({
      id: shoes.id,
      name: shoes.name,
      createdAt: shoes.createdAt,
      updatedAt: shoes.updatedAt,
    });

  if (!updated) {
    return null;
  }

  return updated;
}

export async function deleteShoe(params: { userId: number; shoeId: number }): Promise<boolean> {
  const [deleted] = await db
    .delete(shoes)
    .where(and(eq(shoes.id, params.shoeId), eq(shoes.userId, params.userId)))
    .returning({ id: shoes.id });

  return Boolean(deleted);
}
