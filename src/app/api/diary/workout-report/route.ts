import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { planEntries } from "@/db/schema";
import { isValidDateString } from "@/lib/diary";
import { upsertWorkoutReport } from "@/lib/workoutReports";

const TIME_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const WEATHER_OPTIONS = new Set(["cloudy", "sunny", "rain", "snow"]);
const SURFACE_OPTIONS = new Set(["ground", "asphalt", "manezh", "stadium"]);

const parseOptionalEnum = (value: unknown, options: Set<string>) => {
  if (value === undefined) {
    return { value: undefined, valid: true };
  }
  if (value === null || value === "") {
    return { value: null, valid: true };
  }
  if (typeof value !== "string") {
    return { value: null, valid: false };
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return { value: null, valid: true };
  }
  if (!options.has(trimmed)) {
    return { value: null, valid: false };
  }
  return { value: trimmed, valid: true };
};

const parseOptionalBoolean = (value: unknown) => {
  if (value === undefined) {
    return { value: undefined, valid: true };
  }
  if (value === null || value === "") {
    return { value: null, valid: true };
  }
  if (typeof value === "boolean") {
    return { value, valid: true };
  }
  if (typeof value === "string") {
    if (value === "true") {
      return { value: true, valid: true };
    }
    if (value === "false") {
      return { value: false, valid: true };
    }
  }
  return { value: null, valid: false };
};

const parseOptionalDistance = (value: unknown) => {
  if (value === undefined) {
    return { value: undefined, valid: true };
  }
  if (value === null || value === "") {
    return { value: null, valid: true };
  }
  const parsed =
    typeof value === "number" ? value : Number(String(value).trim().replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { value: null, valid: false };
  }
  return { value: parsed, valid: true };
};

const parseOptionalTemperature = (value: unknown) => {
  if (value === undefined) {
    return { value: undefined, valid: true };
  }
  if (value === null || value === "") {
    return { value: null, valid: true };
  }
  const parsed =
    typeof value === "number" ? value : Number(String(value).trim().replace(",", "."));
  if (!Number.isFinite(parsed)) {
    return { value: null, valid: false };
  }
  const rounded = Math.round(parsed * 10) / 10;
  if (Math.abs(rounded) > 999.9) {
    return { value: null, valid: false };
  }
  return { value: rounded, valid: true };
};

const parseOptionalScore = (value: unknown) => {
  if (value === undefined) {
    return { value: undefined, valid: true };
  }
  if (value === null || value === "") {
    return { value: null, valid: true };
  }
  const parsed = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10) {
    return { value: null, valid: false };
  }
  return { value: parsed, valid: true };
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = Number((session.user as any)?.id);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | {
        planEntryId?: number | string;
        date?: string;
        startTime?: string;
        resultText?: string;
        commentText?: string | null;
        distanceKm?: number | string | null;
        overallScore?: number | string | null;
        functionalScore?: number | string | null;
        muscleScore?: number | string | null;
        weather?: string | null;
        hasWind?: boolean | string | null;
        temperatureC?: number | string | null;
        surface?: string | null;
      }
    | null;

  const planEntryId = Number(body?.planEntryId);
  const date = body?.date ?? null;
  const startTime = typeof body?.startTime === "string" ? body.startTime.trim() : "";
  const resultText = typeof body?.resultText === "string" ? body.resultText : "";
  const trimmedResultText = resultText.trim();
  const commentText =
    typeof body?.commentText === "string" ? body.commentText.trim() : null;
  const distanceKm = parseOptionalDistance(body?.distanceKm);
  const overallScore = parseOptionalScore(body?.overallScore);
  const functionalScore = parseOptionalScore(body?.functionalScore);
  const muscleScore = parseOptionalScore(body?.muscleScore);
  const surface = parseOptionalEnum(body?.surface, SURFACE_OPTIONS);
  const isManezh = surface.value === "manezh";
  const weather = isManezh
    ? { value: null, valid: true }
    : parseOptionalEnum(body?.weather, WEATHER_OPTIONS);
  const hasWind = isManezh
    ? { value: null, valid: true }
    : parseOptionalBoolean(body?.hasWind);
  const temperatureC = isManezh
    ? { value: null, valid: true }
    : parseOptionalTemperature(body?.temperatureC);

  if (!Number.isFinite(planEntryId) || planEntryId <= 0) {
    return NextResponse.json({ error: "invalid_plan_entry" }, { status: 400 });
  }
  if (!isValidDateString(date)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }
  if (!TIME_REGEX.test(startTime)) {
    return NextResponse.json({ error: "invalid_time" }, { status: 400 });
  }
  if (!trimmedResultText) {
    return NextResponse.json({ error: "invalid_result" }, { status: 400 });
  }
  if (!distanceKm.valid) {
    return NextResponse.json({ error: "invalid_distance" }, { status: 400 });
  }
  if (!surface.valid) {
    return NextResponse.json({ error: "invalid_surface" }, { status: 400 });
  }
  if (!weather.valid) {
    return NextResponse.json({ error: "invalid_weather" }, { status: 400 });
  }
  if (!hasWind.valid) {
    return NextResponse.json({ error: "invalid_wind" }, { status: 400 });
  }
  if (!temperatureC.valid) {
    return NextResponse.json({ error: "invalid_temperature" }, { status: 400 });
  }
  if (!overallScore.valid || !functionalScore.valid || !muscleScore.valid) {
    return NextResponse.json({ error: "invalid_score" }, { status: 400 });
  }

  const [entry] = await db
    .select({ id: planEntries.id, date: planEntries.date })
    .from(planEntries)
    .where(and(eq(planEntries.id, planEntryId), eq(planEntries.userId, userId)));
  if (!entry) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (entry.date !== date) {
    return NextResponse.json({ error: "date_mismatch" }, { status: 400 });
  }

  const upsertParams: Parameters<typeof upsertWorkoutReport>[0] = {
    userId,
    planEntryId,
    date: entry.date,
    startTime,
    resultText,
    commentText: commentText && commentText.length > 0 ? commentText : null,
  };
  if (distanceKm.value !== undefined) {
    upsertParams.distanceKm = distanceKm.value;
  }
  if (overallScore.value !== undefined) {
    upsertParams.overallScore = overallScore.value;
  }
  if (functionalScore.value !== undefined) {
    upsertParams.functionalScore = functionalScore.value;
  }
  if (muscleScore.value !== undefined) {
    upsertParams.muscleScore = muscleScore.value;
  }
  if (surface.value !== undefined) {
    upsertParams.surface = surface.value;
  }
  if (weather.value !== undefined) {
    upsertParams.weather = weather.value;
  }
  if (hasWind.value !== undefined) {
    upsertParams.hasWind = hasWind.value;
  }
  if (temperatureC.value !== undefined) {
    upsertParams.temperatureC = temperatureC.value;
  }

  await upsertWorkoutReport(upsertParams);

  return NextResponse.json({ ok: true });
}
