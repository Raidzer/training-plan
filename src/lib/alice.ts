import { db } from "@/db/client";
import { aliceAccounts, aliceLinkCodes, users } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { addMinutes } from "date-fns";

export async function createLinkCode(userId: number): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = addMinutes(new Date(), 5);

  await db.insert(aliceLinkCodes).values({
    userId,
    code,
    expiresAt,
  });

  return code;
}

export async function linkAliceAccount(aliceUserId: string, code: string): Promise<boolean> {
  const validLink = await db.query.aliceLinkCodes.findFirst({
    where: and(eq(aliceLinkCodes.code, code), gt(aliceLinkCodes.expiresAt, new Date())),
  });

  if (!validLink) {
    return false;
  }

  await db
    .insert(aliceAccounts)
    .values({
      userId: validLink.userId,
      aliceUserId,
    })
    .onConflictDoUpdate({
      target: aliceAccounts.aliceUserId,
      set: { userId: validLink.userId, linkedAt: new Date() },
    });

  await db.delete(aliceLinkCodes).where(eq(aliceLinkCodes.code, code));

  return true;
}

export async function getUserIdByAliceId(
  aliceUserId: string
): Promise<{ userId: number; timezone: string } | null> {
  const result = await db
    .select({
      userId: aliceAccounts.userId,
      timezone: users.timezone,
    })
    .from(aliceAccounts)
    .innerJoin(users, eq(aliceAccounts.userId, users.id))
    .where(eq(aliceAccounts.aliceUserId, aliceUserId))
    .limit(1);

  return result[0] ?? null;
}

export function parseWeightCommand(
  text: string
): { weight: number; period: "morning" | "evening" } | null {
  const lowerText = text.toLowerCase();

  // Определение периода
  let period: "morning" | "evening" = "morning"; // default
  if (lowerText.includes("вечер") || lowerText.includes("вечером")) {
    period = "evening";
  }

  const cleanText = lowerText
    .replace("с половиной", ".5")
    .replace(" с ", ".")
    .replace(" и ", ".")
    .replace(/,/g, ".");

  const weightMatch = cleanText.match(/(\d{2,3}(?:\.\d{1,2})?)/);
  if (!weightMatch) {
    return null;
  }

  const weight = parseFloat(weightMatch[1]);
  if (isNaN(weight) || weight < 30 || weight > 200) {
    return null;
  }

  return { weight, period };
}
