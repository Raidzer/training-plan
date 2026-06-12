import { eq, inArray, or } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  aliceAccounts,
  aliceLinkCodes,
  diaryResultTemplates,
  personalRecords,
  planEntries,
  planImports,
  recoveryEntries,
  registrationInvites,
  shoes,
  telegramAccounts,
  telegramLinkCodes,
  telegramSubscriptions,
  users,
  verificationTokens,
  weightEntries,
  workoutReportConditions,
  workoutReportShoes,
  workoutReports,
  workouts,
} from "@/server/db/schema";
import { ROLES } from "@/shared/constants";

type UserRole = "admin" | "coach" | "athlete";

export type DeleteUserAccountResult = { deleted: true } | { error: "not_found" | "forbidden" };

export function canDeleteUserRole(role: string): boolean {
  return role !== ROLES.ADMIN;
}

export async function updateUserPasswordHashById(
  userId: number,
  passwordHash: string
): Promise<boolean> {
  const [updated] = await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, userId))
    .returning({ id: users.id });

  return Boolean(updated);
}

export async function updateUserRoleById(userId: number, role: UserRole) {
  const [updated] = await db
    .update(users)
    .set({ role })
    .where(eq(users.id, userId))
    .returning({ id: users.id, role: users.role });

  if (!updated) {
    return null;
  }

  return updated;
}

export async function updateUserStatusById(userId: number, isActive: boolean) {
  const [updated] = await db
    .update(users)
    .set({ isActive })
    .where(eq(users.id, userId))
    .returning({ id: users.id, isActive: users.isActive });

  if (!updated) {
    return null;
  }

  return updated;
}

export async function deleteUserAccountById(userId: number): Promise<DeleteUserAccountResult> {
  return await db.transaction(async (tx) => {
    const [targetUser] = await tx
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser) {
      return { error: "not_found" as const };
    }

    if (!canDeleteUserRole(targetUser.role)) {
      return { error: "forbidden" as const };
    }

    const planEntryRows = await tx
      .select({ id: planEntries.id })
      .from(planEntries)
      .where(eq(planEntries.userId, userId));
    const planEntryIds = planEntryRows.map((entry) => entry.id);

    const reportRows =
      planEntryIds.length > 0
        ? await tx
            .select({ id: workoutReports.id })
            .from(workoutReports)
            .where(
              or(
                eq(workoutReports.userId, userId),
                inArray(workoutReports.planEntryId, planEntryIds)
              )
            )
        : await tx
            .select({ id: workoutReports.id })
            .from(workoutReports)
            .where(eq(workoutReports.userId, userId));
    const reportIds = reportRows.map((report) => report.id);

    const shoeRows = await tx.select({ id: shoes.id }).from(shoes).where(eq(shoes.userId, userId));
    const shoeIds = shoeRows.map((shoe) => shoe.id);

    await tx.delete(verificationTokens).where(eq(verificationTokens.identifier, targetUser.email));
    await tx.delete(diaryResultTemplates).where(eq(diaryResultTemplates.userId, userId));
    await tx.delete(aliceLinkCodes).where(eq(aliceLinkCodes.userId, userId));
    await tx.delete(aliceAccounts).where(eq(aliceAccounts.userId, userId));
    await tx.delete(telegramSubscriptions).where(eq(telegramSubscriptions.userId, userId));
    await tx.delete(telegramAccounts).where(eq(telegramAccounts.userId, userId));
    await tx.delete(telegramLinkCodes).where(eq(telegramLinkCodes.userId, userId));
    await tx.delete(recoveryEntries).where(eq(recoveryEntries.userId, userId));
    await tx.delete(weightEntries).where(eq(weightEntries.userId, userId));
    await tx.delete(personalRecords).where(eq(personalRecords.userId, userId));
    await tx.delete(workouts).where(eq(workouts.userId, userId));

    if (reportIds.length > 0) {
      await tx
        .delete(workoutReportConditions)
        .where(inArray(workoutReportConditions.workoutReportId, reportIds));
      await tx
        .delete(workoutReportShoes)
        .where(inArray(workoutReportShoes.workoutReportId, reportIds));
      await tx.delete(workoutReports).where(inArray(workoutReports.id, reportIds));
    }

    if (shoeIds.length > 0) {
      await tx.delete(workoutReportShoes).where(inArray(workoutReportShoes.shoeId, shoeIds));
    }

    await tx.delete(planEntries).where(eq(planEntries.userId, userId));
    await tx.delete(planImports).where(eq(planImports.userId, userId));
    await tx.delete(shoes).where(eq(shoes.userId, userId));
    await tx
      .delete(registrationInvites)
      .where(
        or(
          eq(registrationInvites.createdByUserId, userId),
          eq(registrationInvites.usedByUserId, userId)
        )
      );
    await tx.delete(users).where(eq(users.id, userId));

    return { deleted: true as const };
  });
}
