import type { diaryResultTemplates } from "@/server/db/schema";

export type DiaryResultTemplate = typeof diaryResultTemplates.$inferSelect;
export type NewDiaryResultTemplate = typeof diaryResultTemplates.$inferInsert;
