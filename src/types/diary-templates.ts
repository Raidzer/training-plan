import type { diaryResultTemplates } from "@/db/schema";

export type DiaryResultTemplate = typeof diaryResultTemplates.$inferSelect;
export type NewDiaryResultTemplate = typeof diaryResultTemplates.$inferInsert;
