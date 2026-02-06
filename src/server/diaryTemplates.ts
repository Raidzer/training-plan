import { desc, eq, isNull, or } from "drizzle-orm";
import { db } from "@/server/db/client";
import { diaryResultTemplates } from "@/server/db/schema";
import { matchTemplates } from "@/shared/utils/templateMatching";
import type { DiaryResultTemplate, NewDiaryResultTemplate } from "@/shared/types/diary-templates";

export async function getTemplatesForUser(userId: number): Promise<DiaryResultTemplate[]> {
  return await db
    .select()
    .from(diaryResultTemplates)
    .where(or(isNull(diaryResultTemplates.userId), eq(diaryResultTemplates.userId, userId)))
    .orderBy(desc(diaryResultTemplates.sortOrder), desc(diaryResultTemplates.createdAt));
}

export async function getTemplateByIdFromDb(id: number): Promise<DiaryResultTemplate | null> {
  const result = await db
    .select()
    .from(diaryResultTemplates)
    .where(eq(diaryResultTemplates.id, id))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0];
}

export async function createTemplateInDb(data: NewDiaryResultTemplate): Promise<number> {
  const [newTemplate] = await db
    .insert(diaryResultTemplates)
    .values(data)
    .returning({ id: diaryResultTemplates.id });
  return newTemplate.id;
}

export async function updateTemplateInDb(
  id: number,
  data: Partial<NewDiaryResultTemplate>
): Promise<void> {
  await db.update(diaryResultTemplates).set(data).where(eq(diaryResultTemplates.id, id));
}

export async function deleteTemplateInDb(id: number): Promise<void> {
  await db.delete(diaryResultTemplates).where(eq(diaryResultTemplates.id, id));
}

export async function findMatchingTemplates(
  userId: number,
  taskText: string
): Promise<DiaryResultTemplate[]> {
  const templates = await getTemplatesForUser(userId);
  return matchTemplates(templates, taskText);
}
