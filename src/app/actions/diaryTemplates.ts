"use server";

import { desc, eq, isNull, or } from "drizzle-orm";
import { db } from "@/db/client";
import { diaryResultTemplates } from "@/db/schema";
import { revalidatePath } from "next/cache";
import type { NewDiaryResultTemplate } from "@/types/diary-templates";

export async function getTemplates(userId: number) {
  return await db
    .select()
    .from(diaryResultTemplates)
    .where(or(isNull(diaryResultTemplates.userId), eq(diaryResultTemplates.userId, userId)))
    .orderBy(desc(diaryResultTemplates.sortOrder), desc(diaryResultTemplates.createdAt));
}

export async function getTemplateById(id: number) {
  const result = await db
    .select()
    .from(diaryResultTemplates)
    .where(eq(diaryResultTemplates.id, id))
    .limit(1);
  return result[0] || null;
}

import { auth } from "@/auth";

export async function createTemplate(data: NewDiaryResultTemplate) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }
  const [newTemplate] = await db
    .insert(diaryResultTemplates)
    .values(data)
    .returning({ id: diaryResultTemplates.id });
  revalidatePath("/tools/templates");
  return newTemplate.id;
}

export async function updateTemplate(id: number, data: Partial<NewDiaryResultTemplate>) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }
  await db.update(diaryResultTemplates).set(data).where(eq(diaryResultTemplates.id, id));
  revalidatePath("/tools/templates");
}

export async function deleteTemplate(id: number) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }
  await db.delete(diaryResultTemplates).where(eq(diaryResultTemplates.id, id));
  revalidatePath("/tools/templates");
}

import { matchTemplates } from "@/utils/templateMatching";

export async function findMatchingTemplate(userId: number, taskText: string) {
  const templates = await getTemplates(userId);
  return matchTemplates(templates, taskText);
}
