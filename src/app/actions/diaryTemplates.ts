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

export async function getTemplateById(id: number) {
  const result = await db
    .select()
    .from(diaryResultTemplates)
    .where(eq(diaryResultTemplates.id, id))
    .limit(1);
  return result[0] || null;
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

  // Accumulate all matches found
  const allMatches: { template: DiaryResultTemplate; index: number }[] = [];

  templates.forEach((t) => {
    if (!t.matchPattern) return;

    const patterns = t.matchPattern
      .split(";")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    // Track indices found for this specific template to avoid duplicates
    // if multiple patterns match the same text location (e.g. Smart vs Raw)
    const foundIndicesForTemplate = new Set<number>();

    patterns.forEach((pattern) => {
      // Helper function to add match if unique for this template
      const addMatch = (index: number) => {
        if (!foundIndicesForTemplate.has(index)) {
          allMatches.push({ template: t, index });
          foundIndicesForTemplate.add(index);
        }
      };

      // 1. Smart Pattern Match
      try {
        let smartPattern = pattern;
        // Escape standard regex characters
        smartPattern = smartPattern.replace(/[.+?^${}()|[\]\\#*]/g, "\\$&");
        // Restore custom wildcards: # -> \d+, * -> .*
        smartPattern = smartPattern.replace(/\\#/g, "\\d+");
        smartPattern = smartPattern.replace(/\\\*/g, ".*");

        // Use 'g' flag for global search
        const smartRegex = new RegExp(smartPattern, "gi");
        let match;
        while ((match = smartRegex.exec(taskText)) !== null) {
          addMatch(match.index);
        }
      } catch (e) {}

      // 2. Raw Regex Match
      try {
        const regex = new RegExp(pattern, "gi");
        let match;
        while ((match = regex.exec(taskText)) !== null) {
          addMatch(match.index);
        }
      } catch (e) {}
    });
  });

  // Sort all matches by their position in the text
  allMatches.sort((a, b) => a.index - b.index);

  return allMatches.map((item) => item.template);
}
