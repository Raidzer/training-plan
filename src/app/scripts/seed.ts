import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "@/db/client";
import { users } from "@/db/schema";

const run = async () => {
  const hash = await bcrypt.hash("password123", 10);
  await db
    .insert(users)
    .values({
      email: "you@example.com",
      passwordHash: hash,
      role: "admin",
      name: "You",
    })
    .onConflictDoNothing();
  console.log("Seed done");
  process.exit(0);
};
run();
