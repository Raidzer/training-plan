import type { NextRequest } from "next/server";
import { handleAliceWebhook } from "@/alice/webhook";

export async function POST(req: NextRequest) {
  return handleAliceWebhook(req);
}
