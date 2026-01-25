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

export async function findMatchingTemplate(userId: number, taskText: string) {
  const templates = await getTemplates(userId);

  const allMatches: { template: DiaryResultTemplate; index: number; length: number }[] = [];

  templates.forEach((t) => {
    if (!t.matchPattern) return;

    const patterns = t.matchPattern
      .split(";")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const foundIndicesForTemplate = new Set<number>();

    patterns.forEach((pattern) => {
      const addMatch = (index: number, length: number) => {
        if (!foundIndicesForTemplate.has(index)) {
          allMatches.push({ template: t, index, length });
          foundIndicesForTemplate.add(index);
        }
      };

      try {
        let smartPattern = pattern.trim();
        let isAnchored = false;

        if (smartPattern.startsWith("^")) {
          isAnchored = true;
          smartPattern = smartPattern.substring(1);
        }

        smartPattern = smartPattern.replace(/[.+?^${}()|[\]\\#*]/g, "\\$&");

        smartPattern = smartPattern.replace(/\s+/g, "\\s+");

        const rangeValidators: { index: number; min: number; max: number }[] = [];
        let groupIndex = 1;

        smartPattern = smartPattern.replace(
          /\\#\\{(\d+)-(\d+)\\}/g,
          (_, min: string, max: string) => {
            rangeValidators.push({ index: groupIndex++, min: Number(min), max: Number(max) });
            return "(\\d+)";
          }
        );

        smartPattern = smartPattern.replace(/\\#/g, "\\d+");
        smartPattern = smartPattern.replace(/\\\*/g, ".*");

        if (isAnchored) {
          smartPattern = "^" + smartPattern;
        }

        const smartRegex = new RegExp(smartPattern, "gi");
        let match: RegExpExecArray | null;
        while ((match = smartRegex.exec(taskText)) !== null) {
          const currentMatch = match;
          const isValid = rangeValidators.every((v) => {
            const val = parseInt(currentMatch[v.index], 10);
            return !isNaN(val) && val >= v.min && val <= v.max;
          });

          if (isValid) {
            addMatch(currentMatch.index, currentMatch[0].length);
          }
        }
      } catch (e) {
        console.error("Error matching smart pattern", pattern, e);
      }

      try {
        const regex = new RegExp(pattern, "gi");
        let match;
        while ((match = regex.exec(taskText)) !== null) {
          addMatch(match.index, match[0].length);
        }
      } catch (e) {}
    });
  });

  allMatches.sort((a, b) => {
    if (a.index !== b.index) {
      return a.index - b.index;
    }
    return b.length - a.length;
  });

  const uniqueMatches: DiaryResultTemplate[] = [];
  let lastMatchEnd = -1;

  allMatches.forEach((m) => {
    if (m.index >= lastMatchEnd) {
      uniqueMatches.push(m.template);
      lastMatchEnd = m.index + m.length;
    }
  });

  return uniqueMatches;
}
