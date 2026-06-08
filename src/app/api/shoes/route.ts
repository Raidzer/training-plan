import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createShoe, listShoesByUser } from "@/server/shoes";
import {
  parseName,
  parseOptionalFlag,
  parseOptionalMileageKm,
  type ShoePayload,
} from "./shoePayload";
import { validateShoeNotificationAccess } from "./notificationAccess";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = Number((session.user as { id?: string } | undefined)?.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const items = await listShoesByUser(userId);

  return NextResponse.json({ shoes: items });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = Number((session.user as { id?: string } | undefined)?.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as ShoePayload | null;
  const name = parseName(body?.name, true);
  if (!name.valid || !name.value) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }
  const mileageLimitKm = parseOptionalMileageKm(body?.mileageLimitKm);
  const currentMileageKm = parseOptionalMileageKm(body?.currentMileageKm);
  const notifyOnLimitEmail = parseOptionalFlag(body?.notifyOnLimitEmail);
  const notifyOnLimitTelegram = parseOptionalFlag(body?.notifyOnLimitTelegram);

  if (!mileageLimitKm.valid) {
    return NextResponse.json({ error: "invalid_mileage_limit" }, { status: 400 });
  }
  if (!currentMileageKm.valid) {
    return NextResponse.json({ error: "invalid_current_mileage" }, { status: 400 });
  }
  if (!notifyOnLimitEmail.valid) {
    return NextResponse.json({ error: "invalid_notify_on_limit_email" }, { status: 400 });
  }
  if (!notifyOnLimitTelegram.valid) {
    return NextResponse.json({ error: "invalid_notify_on_limit_telegram" }, { status: 400 });
  }

  const notificationAccess = await validateShoeNotificationAccess({
    userId,
    emailVerified: session.user.emailVerified,
    notifyOnLimitEmail: notifyOnLimitEmail.value,
    notifyOnLimitTelegram: notifyOnLimitTelegram.value,
  });
  if (!notificationAccess.valid) {
    return NextResponse.json({ error: notificationAccess.error }, { status: 400 });
  }

  const createParams: Parameters<typeof createShoe>[0] = {
    userId,
    name: name.value,
  };
  if (mileageLimitKm.value !== undefined) {
    createParams.mileageLimitKm = mileageLimitKm.value;
  }
  if (currentMileageKm.value !== undefined) {
    createParams.currentMileageKm = currentMileageKm.value;
  }
  if (notifyOnLimitEmail.value !== undefined) {
    createParams.notifyOnLimitEmail = notifyOnLimitEmail.value;
  }
  if (notifyOnLimitTelegram.value !== undefined) {
    createParams.notifyOnLimitTelegram = notifyOnLimitTelegram.value;
  }

  const created = await createShoe(createParams);

  return NextResponse.json({ shoe: created }, { status: 201 });
}
