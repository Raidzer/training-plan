import { db } from "@/db/client";
import { users } from "@/db/schema";
import { hash } from "bcryptjs";

const SEED_EMAIL = "testNikita@example.com";

async function main() {
  await db
    .insert(users)
    .values({
      name: "Test User",
      lastName: "",
      gender: "male",
      email: SEED_EMAIL,
      login: "testNikita",
      passwordHash: await hash("password", 10),
    })
    .onConflictDoNothing();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
