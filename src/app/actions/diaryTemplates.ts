"use server";

import { revalidatePath } from "next/cache";
import type { NewDiaryResultTemplate } from "@/shared/types/diary-templates";
import {
  createTemplateInDb,
  deleteTemplateInDb,
  findMatchingTemplates,
  findMatchingTemplatesWithDetails,
  getTemplateByIdFromDb,
  getTemplatesForUser,
  updateTemplateInDb,
} from "@/server/diaryTemplates";
import { auth } from "@/auth";

async function getSessionUserId(): Promise<number> {
  const session = await auth();
  const userId = Number(session?.user?.id);

  if (!session || !Number.isSafeInteger(userId) || userId <= 0) {
    throw new Error("Unauthorized");
  }

  return userId;
}

export async function getTemplates() {
  const userId = await getSessionUserId();
  return await getTemplatesForUser(userId);
}

export async function getTemplateById(id: number) {
  const userId = await getSessionUserId();
  return await getTemplateByIdFromDb(id, userId);
}

export async function createTemplate(data: NewDiaryResultTemplate) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }
  const newTemplateId = await createTemplateInDb(data);
  revalidatePath("/tools/templates");
  return newTemplateId;
}

export async function updateTemplate(id: number, data: Partial<NewDiaryResultTemplate>) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }
  await updateTemplateInDb(id, data);
  revalidatePath("/tools/templates");
}

export async function deleteTemplate(id: number) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }
  await deleteTemplateInDb(id);
  revalidatePath("/tools/templates");
}

export async function findMatchingTemplate(taskText: string) {
  const userId = await getSessionUserId();
  return await findMatchingTemplates(userId, taskText);
}

export async function findMatchingTemplateWithDetails(taskText: string) {
  const userId = await getSessionUserId();
  return await findMatchingTemplatesWithDetails(userId, taskText);
}
