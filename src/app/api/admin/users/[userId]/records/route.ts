import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { isValidDateString } from "@/lib/diary";
import {
  MAX_PROTOCOL_URL_LENGTH,
  MAX_RACE_CITY_LENGTH,
  MAX_RACE_NAME_LENGTH,
  PERSONAL_RECORD_DISTANCES,
  PERSONAL_RECORD_TIME_REGEX,
  type PersonalRecordDistanceKey,
} from "@/lib/personalRecords.constants";
import {
  getPersonalRecords,
  upsertPersonalRecords,
  type PersonalRecordInput,
} from "@/lib/personalRecords";

type PersonalRecordPayload = {
  distanceKey?: string;
  timeText?: string | null;
  recordDate?: string | null;
  protocolUrl?: string | null;
  raceName?: string | null;
  raceCity?: string | null;
};

const distanceKeySet = new Set(PERSONAL_RECORD_DISTANCES.map((item) => item.key));
const distanceOrder = new Map<string, number>(
  PERSONAL_RECORD_DISTANCES.map((item, index) => [item.key, index])
);

const normalizeTimeText = (value: string) => value.trim().replace(",", ".");

const sortByDistance = <T extends { distanceKey: string }>(items: T[]) =>
  items
    .slice()
    .sort(
      (left, right) =>
        (distanceOrder.get(left.distanceKey) ?? 0) - (distanceOrder.get(right.distanceKey) ?? 0)
    );

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { userId: userIdParam } = await params;
  const userId = Number(userIdParam);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "invalid_user_id" }, { status: 400 });
  }

  const records = await getPersonalRecords({ userId });
  return NextResponse.json({ records: sortByDistance(records) });
}

export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { userId: userIdParam } = await params;
  const userId = Number(userIdParam);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "invalid_user_id" }, { status: 400 });
  }

  const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId));
  if (!existingUser) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as { records?: PersonalRecordPayload[] } | null;
  const incomingRecords = Array.isArray(body?.records) ? body?.records : null;
  if (!incomingRecords || incomingRecords.length === 0) {
    return NextResponse.json({ error: "empty_records" }, { status: 400 });
  }

  const seenKeys = new Set<string>();
  const normalized: PersonalRecordInput[] = [];
  for (const entry of incomingRecords) {
    const distanceKey = typeof entry?.distanceKey === "string" ? entry.distanceKey.trim() : "";
    if (!distanceKey || !distanceKeySet.has(distanceKey as PersonalRecordDistanceKey)) {
      return NextResponse.json({ error: "invalid_distance" }, { status: 400 });
    }
    if (seenKeys.has(distanceKey)) {
      return NextResponse.json({ error: "duplicate_distance" }, { status: 400 });
    }
    seenKeys.add(distanceKey);

    const rawTime = typeof entry?.timeText === "string" ? entry.timeText.trim() : "";
    const timeText = rawTime ? normalizeTimeText(rawTime) : "";
    const recordDate = typeof entry?.recordDate === "string" ? entry.recordDate.trim() : "";
    const protocolUrl = typeof entry?.protocolUrl === "string" ? entry.protocolUrl.trim() : "";
    const raceName = typeof entry?.raceName === "string" ? entry.raceName.trim() : "";
    const raceCity = typeof entry?.raceCity === "string" ? entry.raceCity.trim() : "";

    if (!timeText) {
      normalized.push({
        distanceKey: distanceKey as PersonalRecordDistanceKey,
        timeText: "",
        recordDate: null,
        protocolUrl: null,
        raceName: null,
        raceCity: null,
      });
      continue;
    }

    if (!PERSONAL_RECORD_TIME_REGEX.test(timeText)) {
      return NextResponse.json({ error: "invalid_time" }, { status: 400 });
    }
    if (!recordDate || !isValidDateString(recordDate)) {
      return NextResponse.json({ error: "invalid_date" }, { status: 400 });
    }
    if (protocolUrl && protocolUrl.length > MAX_PROTOCOL_URL_LENGTH) {
      return NextResponse.json({ error: "invalid_protocol_url" }, { status: 400 });
    }
    if (raceName && raceName.length > MAX_RACE_NAME_LENGTH) {
      return NextResponse.json({ error: "invalid_race_name" }, { status: 400 });
    }
    if (raceCity && raceCity.length > MAX_RACE_CITY_LENGTH) {
      return NextResponse.json({ error: "invalid_race_city" }, { status: 400 });
    }

    normalized.push({
      distanceKey: distanceKey as PersonalRecordDistanceKey,
      timeText,
      recordDate,
      protocolUrl: protocolUrl || null,
      raceName: raceName || null,
      raceCity: raceCity || null,
    });
  }

  await upsertPersonalRecords({ userId, records: normalized });
  const records = await getPersonalRecords({ userId });
  return NextResponse.json({ records: sortByDistance(records) });
}
