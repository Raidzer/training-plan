import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { importDiaryFromWorkbook } from "@/server/diaryImports";
import { readSpreadsheetFile, SpreadsheetLimitError } from "@/server/spreadsheetLimits";
import { runSpreadsheetOperation, SpreadsheetOperationError } from "@/server/spreadsheetOperations";
import { isTrainingDataBusyError } from "@/server/trainingDataLock";

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

  try {
    return await runSpreadsheetOperation(req.signal, async () => {
      const file = await readSpreadsheetFile(req);
      const result = await importDiaryFromWorkbook({ userId, buffer: await file.arrayBuffer() });
      return NextResponse.json(result);
    });
  } catch (error) {
    if (isTrainingDataBusyError(error)) {
      return NextResponse.json({ error: "Сервер занят. Повторите импорт позже" }, { status: 503 });
    }
    const message = error instanceof Error ? error.message : "Не удалось импортировать дневник";
    const status =
      error instanceof SpreadsheetLimitError || error instanceof SpreadsheetOperationError
        ? error.status
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
