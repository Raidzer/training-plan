import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { canDeleteUserRole, deleteUserAccountById } from "@/server/adminUsers";
import { isSameOriginRequest } from "@/server/requestSecurity";
import { getUserDeletionCredentialsById } from "@/server/services/users";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Текущий пароль обязателен").max(1024),
  })
  .strict();

export async function DELETE(req: Request) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = Number((session.user as { id?: string } | undefined)?.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    const user = await getUserDeletionCredentialsById(userId);
    if (!user) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (!canDeleteUserRole(user.role)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      parsed.data.currentPassword,
      user.passwordHash
    );
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: "invalid_current_password" }, { status: 403 });
    }

    const result = await deleteUserAccountById(userId);
    if ("error" in result) {
      const status = result.error === "not_found" ? 404 : 403;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
