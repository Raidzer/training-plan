import "dotenv/config";
import { db } from "../db/client";
import { users, telegramSubscriptions } from "../db/schema";
import { eq, isNotNull } from "drizzle-orm";

async function main() {
  console.log("Starting timezone migration...");

  const subscriptions = await db
    .select({
      userId: telegramSubscriptions.userId,
      timezone: telegramSubscriptions.timezone,
    })
    .from(telegramSubscriptions)
    .where(isNotNull(telegramSubscriptions.timezone));

  console.log(`Found ${subscriptions.length} subscriptions with timezone`);

  let updatedCount = 0;
  for (const sub of subscriptions) {
    if (sub.timezone) {
      // Check if user already has a timezone set (optional, maybe overwrite?)
      // Let's overwrite to ensure sync
      await db.update(users).set({ timezone: sub.timezone }).where(eq(users.id, sub.userId));
      updatedCount++;
    }
  }

  console.log(`Updated ${updatedCount} users with timezone`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
