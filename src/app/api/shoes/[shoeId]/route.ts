import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteShoe, updateShoe } from "@/server/shoes";
import {
  parseName,
  parseOptionalFlag,
  parseOptionalMileageKm,
  type ShoePayload,
} from "../shoePayload";
import { validateShoeNotificationAccess } from "../notificationAccess";

type Params = {
  shoeId: string;
};

export async function PATCH(req: Request, { params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = Number((session.user as { id?: string } | undefined)?.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const shoeId = Number(resolvedParams.shoeId);
  if (!Number.isFinite(shoeId)) {
    return NextResponse.json({ error: "invalid_shoe_id" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as ShoePayload | null;
  const name = parseName(body?.name, false);
  if (!name.valid) {
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

  const updateParams: Parameters<typeof updateShoe>[0] = {
    userId,
    shoeId,
  };
  if (name.value !== null) {
    updateParams.name = name.value;
  }
  if (mileageLimitKm.value !== undefined) {
    updateParams.mileageLimitKm = mileageLimitKm.value;
  }
  if (currentMileageKm.value !== undefined) {
    updateParams.currentMileageKm = currentMileageKm.value;
  }
  if (notifyOnLimitEmail.value !== undefined) {
    updateParams.notifyOnLimitEmail = notifyOnLimitEmail.value;
  }
  if (notifyOnLimitTelegram.value !== undefined) {
    updateParams.notifyOnLimitTelegram = notifyOnLimitTelegram.value;
  }

  const hasUpdates =
    updateParams.name !== undefined ||
    updateParams.mileageLimitKm !== undefined ||
    updateParams.currentMileageKm !== undefined ||
    updateParams.notifyOnLimitEmail !== undefined ||
    updateParams.notifyOnLimitTelegram !== undefined;
  if (!hasUpdates) {
    return NextResponse.json({ error: "empty_update" }, { status: 400 });
  }

  const updated = await updateShoe(updateParams);

  if (!updated) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ shoe: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = Number((session.user as { id?: string } | undefined)?.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const shoeId = Number(resolvedParams.shoeId);
  if (!Number.isFinite(shoeId)) {
    return NextResponse.json({ error: "invalid_shoe_id" }, { status: 400 });
  }

  const deleted = await deleteShoe({ userId, shoeId });
  if (!deleted) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
