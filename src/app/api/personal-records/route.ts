import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isValidDateString } from "@/lib/diary";
import {
  MAX_PROTOCOL_URL_LENGTH,
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
};

const distanceKeySet = new Set(
  PERSONAL_RECORD_DISTANCES.map((item) => item.key)
);
const distanceOrder = new Map<string, number>(
  PERSONAL_RECORD_DISTANCES.map((item, index) => [item.key, index])
);

const normalizeTimeText = (value: string) => value.trim().replace(",", ".");

const sortByDistance = <T extends { distanceKey: string }>(items: T[]) =>
  items
    .slice()
    .sort(
      (left, right) =>
        (distanceOrder.get(left.distanceKey) ?? 0) -
        (distanceOrder.get(right.distanceKey) ?? 0)
    );

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = Number((session.user as { id?: string } | undefined)?.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const records = await getPersonalRecords({ userId });
  return NextResponse.json({ records: sortByDistance(records) });
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

  const body = (await req.json().catch(() => null)) as
    | { records?: PersonalRecordPayload[] }
    | null;
  const incomingRecords = Array.isArray(body?.records) ? body?.records : null;
  if (!incomingRecords || incomingRecords.length === 0) {
    return NextResponse.json({ error: "empty_records" }, { status: 400 });
  }

  const seenKeys = new Set<string>();
  const normalized: PersonalRecordInput[] = [];
  for (const entry of incomingRecords) {
    const distanceKey =
      typeof entry?.distanceKey === "string" ? entry.distanceKey.trim() : "";
    if (!distanceKey || !distanceKeySet.has(distanceKey)) {
      return NextResponse.json({ error: "invalid_distance" }, { status: 400 });
    }
    if (seenKeys.has(distanceKey)) {
      return NextResponse.json(
        { error: "duplicate_distance" },
        { status: 400 }
      );
    }
    seenKeys.add(distanceKey);

    const rawTime =
      typeof entry?.timeText === "string" ? entry.timeText.trim() : "";
    const timeText = rawTime ? normalizeTimeText(rawTime) : "";
    const recordDate =
      typeof entry?.recordDate === "string" ? entry.recordDate.trim() : "";
    const protocolUrl =
      typeof entry?.protocolUrl === "string" ? entry.protocolUrl.trim() : "";

    if (!timeText) {
      normalized.push({
        distanceKey: distanceKey as PersonalRecordDistanceKey,
        timeText: "",
        recordDate: null,
        protocolUrl: null,
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
      return NextResponse.json(
        { error: "invalid_protocol_url" },
        { status: 400 }
      );
    }

    normalized.push({
      distanceKey: distanceKey as PersonalRecordDistanceKey,
      timeText,
      recordDate,
      protocolUrl: protocolUrl || null,
    });
  }

  await upsertPersonalRecords({ userId, records: normalized });
  const records = await getPersonalRecords({ userId });
  return NextResponse.json({ records: sortByDistance(records) });
}
