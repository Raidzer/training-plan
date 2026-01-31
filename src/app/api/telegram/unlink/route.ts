import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/server/db/client";
import { telegramAccounts, telegramLinkCodes, telegramSubscriptions } from "@/server/db/schema";

export async function POST() {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await db.transaction(async (tx) => {
      const accounts = await tx
        .delete(telegramAccounts)
        .where(eq(telegramAccounts.userId, userId))
        .returning({ id: telegramAccounts.id });
      const subscriptions = await tx
        .delete(telegramSubscriptions)
        .where(eq(telegramSubscriptions.userId, userId))
        .returning({ id: telegramSubscriptions.id });
      const codes = await tx
        .delete(telegramLinkCodes)
        .where(eq(telegramLinkCodes.userId, userId))
        .returning({ id: telegramLinkCodes.id });

      return {
        accounts: accounts.length,
        subscriptions: subscriptions.length,
        codes: codes.length,
      };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Failed to unlink telegram account", error);
    return NextResponse.json({ error: "unlink-failed" }, { status: 500 });
  }
}
