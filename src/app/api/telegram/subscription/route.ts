import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { TIME_REGEX } from "@/bot/utils/validators";
import { isSameOriginRequest } from "@/server/requestSecurity";
import { updateTelegramSubscriptionSettings } from "@/server/telegram";

const telegramSubscriptionSchema = z
  .object({
    enabled: z.boolean(),
    sendTime: z.string().trim().regex(TIME_REGEX, "Неверное время").nullable(),
  })
  .strict()
  .refine((value) => !value.enabled || Boolean(value.sendTime), {
    message: "Время рассылки обязательно для включенной подписки",
    path: ["sendTime"],
  });

export async function PATCH(req: Request) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = telegramSubscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    const subscription = await updateTelegramSubscriptionSettings(userId, parsed.data);
    if (!subscription) {
      return NextResponse.json({ error: "telegram_not_linked" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error("Failed to update telegram subscription", error);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}
