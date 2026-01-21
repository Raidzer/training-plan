import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import z from "zod";

const schema = z.object({
  userId: z.number(),
  name: z.string,
  gender: z.string,
});

export async function PATCH(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
    }

    const { name, gender, userId } = parsed.data;

    let user;

    if (userId) {
      [user] = await db
        .select({
          id: users.id,
          gender: users.gender,
          name: users.name,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
    }
  } catch {}
}
