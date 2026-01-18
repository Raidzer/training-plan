"use server";

import { desc, eq, isNull, or } from "drizzle-orm";
import { db } from "@/db/client";
import { diaryResultTemplates } from "@/db/schema";
import { revalidatePath } from "next/cache";

export type DiaryResultTemplate = typeof diaryResultTemplates.$inferSelect;
export type NewDiaryResultTemplate = typeof diaryResultTemplates.$inferInsert;

export async function getTemplates(userId: number) {
  return await db
    .select()
    .from(diaryResultTemplates)
    .where(or(isNull(diaryResultTemplates.userId), eq(diaryResultTemplates.userId, userId)))
    .orderBy(desc(diaryResultTemplates.sortOrder), desc(diaryResultTemplates.createdAt));
}

export async function createTemplate(data: NewDiaryResultTemplate) {
  await db.insert(diaryResultTemplates).values(data);
  revalidatePath("/tools/templates");
}

export async function updateTemplate(id: number, data: Partial<NewDiaryResultTemplate>) {
  await db.update(diaryResultTemplates).set(data).where(eq(diaryResultTemplates.id, id));
  revalidatePath("/tools/templates");
}

export async function deleteTemplate(id: number) {
  await db.delete(diaryResultTemplates).where(eq(diaryResultTemplates.id, id));
  revalidatePath("/tools/templates");
}

export async function findMatchingTemplate(userId: number, taskText: string) {
  const templates = await getTemplates(userId);
  const normalizedText = taskText.toLowerCase();

  // Find all templates that match and determine their position
  const matchesWithIndex = templates
    .map((t) => {
      if (!t.matchPattern) {
        return null;
      }

      const patterns = t.matchPattern
        .split(";")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      let firstMatchIndex = Infinity;
      let isMatch = false;

      patterns.forEach((pattern) => {
        const subIndex = normalizedText.indexOf(pattern.toLowerCase());
        if (subIndex !== -1) {
          isMatch = true;
          if (subIndex < firstMatchIndex) firstMatchIndex = subIndex;
        }

        try {
          let smartPattern = pattern;
          smartPattern = smartPattern.replace(/[.+?^${}()|[\]\\#*]/g, "\\$&");
          smartPattern = smartPattern.replace(/\\#/g, "\\d+");
          smartPattern = smartPattern.replace(/\\\*/g, ".*");

          const smartRegex = new RegExp(smartPattern, "i");
          const currMatch = smartRegex.exec(taskText);
          if (currMatch) {
            isMatch = true;
            if (currMatch.index < firstMatchIndex) firstMatchIndex = currMatch.index;
          }
        } catch (e) {}

        try {
          const regex = new RegExp(pattern, "i");
          const currMatch = regex.exec(taskText);
          if (currMatch) {
            isMatch = true;
            if (currMatch.index < firstMatchIndex) firstMatchIndex = currMatch.index;
          }
        } catch (e) {}
      });

      if (isMatch) {
        return { template: t, index: firstMatchIndex };
      }
      return null;
    })
    .filter((item): item is { template: DiaryResultTemplate; index: number } => item !== null)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.template);

  return matchesWithIndex;
}
