"use server";

import { revalidatePath } from "next/cache";
import type { NewDiaryResultTemplate } from "@/shared/types/diary-templates";
import {
  createTemplateInDb,
  deleteTemplateInDb,
  findMatchingTemplates,
  getTemplateByIdFromDb,
  getTemplatesForUser,
  updateTemplateInDb,
} from "@/server/diaryTemplates";
import { auth } from "@/auth";

export async function getTemplates(userId: number) {
  return await getTemplatesForUser(userId);
}

export async function getTemplateById(id: number) {
  return await getTemplateByIdFromDb(id);
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

export async function findMatchingTemplate(userId: number, taskText: string) {
  return await findMatchingTemplates(userId, taskText);
}
