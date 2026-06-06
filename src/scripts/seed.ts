import "dotenv/config";

import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { ROLES } from "@/shared/constants";
import { hash } from "bcryptjs";

const SEED_EMAIL = "testNikita@example.com";

async function main() {
  const passwordHash = await hash("password", 10);
  const emailVerified = new Date();

  await db
    .insert(users)
    .values({
      name: "Test User",
      lastName: "",
      gender: "male",
      email: SEED_EMAIL,
      login: "testNikita",
      passwordHash,
      role: ROLES.ADMIN,
      emailVerified,
    })
    .onConflictDoUpdate({
      target: users.login,
      set: {
        passwordHash,
        role: ROLES.ADMIN,
        isActive: true,
        emailVerified,
      },
    });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
