import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdByAliceId, linkAliceAccount } from "@/alice/accounts";
import { hasSleepMarker, parseSleepCommand, parseWeightCommand } from "@/alice/parser";
import { upsertRecoveryEntry } from "@/server/recoveryEntries";
import { upsertWeightEntry } from "@/server/weightEntries";
import { formatDateInTimeZone, formatDateLocal, isValidTimeZone } from "@/bot/utils/dateTime";
import type { AliceReplayEntry, AliceRequest, AliceResponse, AliceSessionData } from "./types";

const ALICE_WEBHOOK_SECRET_HEADER = "x-alice-webhook-secret";
const ALICE_REPLAY_TTL_MS = 5 * 60 * 1000;

if (!(globalThis as any).aliceReplayCache) {
  (globalThis as any).aliceReplayCache = new Map<string, AliceReplayEntry>();
}
const replayCache = (globalThis as any).aliceReplayCache as Map<string, AliceReplayEntry>;

if (!(globalThis as any).sessionStore) {
  (globalThis as any).sessionStore = new Map<string, AliceSessionData>();
}
const sessionStore = (globalThis as any).sessionStore as Map<string, AliceSessionData>;

function hasValidWebhookSecret(req: Request): boolean {
  const expectedSecret = process.env.ALICE_WEBHOOK_SECRET;
  const receivedSecret = req.headers.get(ALICE_WEBHOOK_SECRET_HEADER);
  if (!expectedSecret || !receivedSecret) {
    return false;
  }

  const expectedBytes = Buffer.from(expectedSecret, "utf8");
  const receivedBytes = Buffer.from(receivedSecret, "utf8");
  return (
    expectedBytes.length === receivedBytes.length && timingSafeEqual(expectedBytes, receivedBytes)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAliceRequest(value: unknown): value is AliceRequest {
  if (!isRecord(value)) {
    return false;
  }

  const session = value.session;
  const request = value.request;
  const user = isRecord(session) ? session.user : undefined;

  return (
    isRecord(session) &&
    Number.isInteger(session.message_id) &&
    Number(session.message_id) >= 0 &&
    typeof session.session_id === "string" &&
    session.session_id.length > 0 &&
    typeof session.skill_id === "string" &&
    session.skill_id.length > 0 &&
    typeof session.new === "boolean" &&
    (user === undefined ||
      (isRecord(user) && typeof user.user_id === "string" && user.user_id.length > 0)) &&
    isRecord(request) &&
    typeof request.command === "string" &&
    typeof request.original_utterance === "string" &&
    typeof value.version === "string"
  );
}

const getDiaryDate = (timezone: string) => {
  if (timezone && isValidTimeZone(timezone)) {
    return formatDateInTimeZone(new Date(), timezone);
  }

  return formatDateLocal(new Date());
};

const formatSleepHours = (sleepHours: number) => {
  const clampedSleepHours = Math.min(Math.max(sleepHours, 0), 24);
  let hours = Math.floor(clampedSleepHours);
  let minutes = Math.round((clampedSleepHours - hours) * 60);

  if (minutes === 60) {
    hours = Math.min(hours + 1, 24);
    minutes = 0;
  }

  if (hours === 24) {
    minutes = 0;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

async function buildAliceResponse(body: AliceRequest): Promise<AliceResponse> {
  const command = body.request.command;
  const originalUtterance = body.request.original_utterance;
  const aliceUserId = body.session.user?.user_id;
  const sessionId = JSON.stringify([body.session.skill_id, body.session.session_id, aliceUserId]);

  if (originalUtterance === "ping") {
    sessionStore.delete(sessionId);
    return {
      version: body.version,
      session: { session_id: body.session.session_id, message_id: body.session.message_id },
      response: { text: "pong", end_session: true },
    };
  }

  if (!aliceUserId) {
    return {
      version: body.version,
      response: { text: "Не удалось определить пользователя Алисы.", end_session: true },
    };
  }

  const memoryState = sessionStore.get(sessionId);
  const expectedPeriod = body.state?.session?.expected_period || memoryState?.expectedPeriod;
  const expectedEntry = body.state?.session?.expected_entry || memoryState?.expectedEntry;
  const response: AliceResponse = {
    version: body.version,
    response: { text: "Я вас не поняла.", end_session: false },
  };
  const userData = await getUserIdByAliceId(aliceUserId);

  if (
    command.toLowerCase().includes("помощь") ||
    command.toLowerCase().includes("что ты умеешь") ||
    command.toLowerCase().includes("справка")
  ) {
    response.response.text =
      "Я умею записывать ваш утренний и вечерний вес, а также сегодняшний сон в дневник тренировок. \n\n" +
      "Просто скажите: 'Вес утро 75.5', 'Запиши вечерний вес 76' или 'Запиши сон 7.5'. \n\n" +
      (userData
        ? "Вы уже привязали аккаунт и можете диктовать вес и сон."
        : "Сначала нужно связать аккаунт с Telegram-ботом. Скажите 'Связать аккаунт' и назовите код из бота.");
    return response;
  }

  const codeMatch = command.match(/\d{6}/);
  if (
    command.toLowerCase().includes("связать") ||
    command.toLowerCase().includes("код") ||
    codeMatch
  ) {
    if (codeMatch) {
      const success = await linkAliceAccount(aliceUserId, codeMatch[0]);
      response.response.text = success
        ? "Аккаунт успешно привязан! Теперь вы можете диктовать мне свой вес и сон."
        : "Неверный код или срок его действия истек. Попробуйте получить новый код у бота.";
      response.response.end_session = true;
      return response;
    }
    response.response.text =
      "Чтобы связать аккаунт, скажите 'Связать' и назовите 6-значный код из Telegram бота.";
    return response;
  }

  if (!userData) {
    response.response.text =
      "Я вас пока не знаю. Получите код привязки в Telegram боте и скажите мне: 'Связать аккаунт [код]'.";
    return response;
  }

  const { userId, timezone } = userData;
  const normalizedCommand = command.toLowerCase();
  if (expectedEntry === "sleep") {
    const sleepData = parseSleepCommand(command, { allowNumericOnly: true });
    if (!sleepData) {
      response.response.text = "Не поняла сон. Скажите, например: '7 и 30' или '8 часов'.";
      response.session_state = { ...response.session_state, expected_entry: "sleep" };
      sessionStore.set(sessionId, { expectedEntry: "sleep" });
      return response;
    }
    await upsertRecoveryEntry({
      userId,
      date: getDiaryDate(timezone),
      sleepHours: sleepData.sleepHours,
    });
    response.response.text = `Записала сегодняшний сон: ${formatSleepHours(sleepData.sleepHours)}.`;
    response.response.end_session = true;
    sessionStore.delete(sessionId);
    return response;
  }

  const sleepData = parseSleepCommand(command);
  if (sleepData) {
    await upsertRecoveryEntry({
      userId,
      date: getDiaryDate(timezone),
      sleepHours: sleepData.sleepHours,
    });
    response.response.text = `Записала сегодняшний сон: ${formatSleepHours(sleepData.sleepHours)}.`;
    response.response.end_session = true;
    sessionStore.delete(sessionId);
    return response;
  }

  const weightData = parseWeightCommand(command);
  if (weightData) {
    const explicitMorning =
      command.toLowerCase().includes("утро") || command.toLowerCase().includes("утрен");
    if (weightData.period === "morning" && !explicitMorning && expectedPeriod === "evening") {
      weightData.period = "evening";
    }
    await upsertWeightEntry({
      userId,
      date: getDiaryDate(timezone),
      period: weightData.period,
      weightKg: weightData.weight,
    });
    const periodLabel = weightData.period === "morning" ? "утренний" : "вечерний";
    response.response.text = `Записала ${periodLabel} вес: ${weightData.weight} кг.`;
    response.response.end_session = true;
    sessionStore.delete(sessionId);
    return response;
  }

  if (
    (body.session.new && !command) ||
    normalizedCommand === "привет" ||
    normalizedCommand.includes("запиши") ||
    normalizedCommand.includes("записать") ||
    normalizedCommand.includes("старт") ||
    normalizedCommand.includes("меню") ||
    normalizedCommand.includes("вес") ||
    hasSleepMarker(normalizedCommand)
  ) {
    if (hasSleepMarker(normalizedCommand)) {
      response.response.text = "Привет! Диктуйте сегодняшний сон.";
      response.session_state = { ...response.session_state, expected_entry: "sleep" };
      sessionStore.set(sessionId, { expectedEntry: "sleep" });
    } else if (normalizedCommand.includes("утренний") || normalizedCommand.includes("утро")) {
      response.response.text = "Привет! Диктуйте утренний вес.";
      response.session_state = { ...response.session_state, expected_period: "morning" };
      sessionStore.set(sessionId, { expectedPeriod: "morning" });
    } else if (normalizedCommand.includes("вечерний") || normalizedCommand.includes("вечер")) {
      response.response.text = "Привет! Диктуйте вечерний вес.";
      response.session_state = { ...response.session_state, expected_period: "evening" };
      sessionStore.set(sessionId, { expectedPeriod: "evening" });
    } else {
      response.response.text = "Привет! Диктуйте утренний или вечерний вес.";
    }
    return response;
  }

  response.response.text = "Не поняла команду. Скажите, например: 'Вес утро 75 и 5'";
  return response;
}

export async function handleAliceWebhook(req: NextRequest) {
  if (!hasValidWebhookSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: unknown = await req.json();
    if (!isAliceRequest(body)) {
      return NextResponse.json({ error: "Invalid Alice request" }, { status: 400 });
    }

    if (body.session.skill_id !== process.env.ALICE_SKILL_ID) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const replayKey = JSON.stringify([
      body.session.skill_id,
      body.session.session_id,
      body.session.user?.user_id,
      body.session.message_id,
    ]);
    const now = Date.now();
    for (const [key, entry] of replayCache) {
      if (entry.expiresAt <= now) replayCache.delete(key);
    }
    const replayEntry = replayCache.get(replayKey);
    if (replayEntry) return NextResponse.json(await replayEntry.response);

    const responsePromise = buildAliceResponse(body);
    replayCache.set(replayKey, { expiresAt: now + ALICE_REPLAY_TTL_MS, response: responsePromise });
    try {
      return NextResponse.json(await responsePromise);
    } catch (error) {
      replayCache.delete(replayKey);
      throw error;
    }
  } catch (error) {
    console.error("Alice Webhook Error:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    return NextResponse.json(
      { version: "1.0", response: { text: "Произошла ошибка на сервере.", end_session: true } },
      { status: 200 }
    );
  }
}
