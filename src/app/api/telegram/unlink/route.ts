import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { unlinkTelegramAccount } from "@/server/telegram";

export async function POST() {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await unlinkTelegramAccount(userId);

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Failed to unlink telegram account", error);
    return NextResponse.json({ error: "unlink-failed" }, { status: 500 });
  }
}
