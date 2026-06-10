import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { importDiaryFromWorkbook } from "@/server/diaryImports";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = Number((session.user as any)?.id);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Не найден файл в поле file" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  try {
    const result = await importDiaryFromWorkbook({
      userId,
      buffer,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось импортировать дневник";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
