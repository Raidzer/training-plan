import { NextRequest, NextResponse } from "next/server";
import { getUserIdByAliceId, linkAliceAccount, parseWeightCommand } from "@/lib/alice";
import { upsertWeightEntry } from "@/lib/weightEntries";
import { formatDateInTimeZone, formatDateLocal, isValidTimeZone } from "@/bot/utils/dateTime";

type AliceRequest = {
  meta: {
    client_id: string;
    locale: string;
    timezone: string;
  };
  session: {
    message_id: number;
    session_id: string;
    skill_id: string;
    user: {
      user_id: string;
    };
    new: boolean;
  };
  request: {
    command: string;
    original_utterance: string;
    nlu: {
      tokens: string[];
      entities: any[];
      intents: Record<string, any>;
    };
  };
  state?: {
    session?: {
      is_moderator?: boolean;
    };
  };
  version: string;
};

type AliceResponse = {
  version: string;
  response: {
    text: string;
    end_session: boolean;
  };
  session_state?: {
    is_moderator?: boolean;
  };
};

const MODERATOR_CODE = "999999";

if (!(globalThis as any).moderatorSessions) {
  (globalThis as any).moderatorSessions = new Set<string>();
}
const moderatorSessions = (globalThis as any).moderatorSessions as Set<string>;

export async function POST(req: NextRequest) {
  try {
    const body: AliceRequest = await req.json();
    const aliceUserId = body.session.user.user_id;
    const command = body.request.command;
    const originalUtterance = body.request.original_utterance;
    const sessionId = body.session.session_id;

    const isModeratorSession =
      body.state?.session?.is_moderator === true || moderatorSessions.has(sessionId);

    const response: AliceResponse = {
      version: body.version,
      response: {
        text: "Я вас не поняла.",
        end_session: false,
      },
    };

    if (isModeratorSession) {
      response.session_state = { is_moderator: true };
      moderatorSessions.add(sessionId);
    }

    const userData = await getUserIdByAliceId(aliceUserId);

    if (
      command.toLowerCase().includes("помощь") ||
      command.toLowerCase().includes("что ты умеешь") ||
      command.toLowerCase().includes("справка")
    ) {
      response.response.text =
        "Я умею записывать ваш утренний и вечерний вес в дневник тренировок. \n\n" +
        "Просто скажите: 'Вес утро 75.5' или 'Запиши вечерний вес 76'. \n\n" +
        (userData || isModeratorSession
          ? "Вы уже привязали аккаунт и можете диктовать вес."
          : "Сначала нужно связать аккаунт с Telegram-ботом. Скажите 'Связать аккаунт' и назовите код из бота.");
      return NextResponse.json(response);
    }

    const codeMatch = command.match(/\d{6}/);
    if (
      command.toLowerCase().includes("связать") ||
      command.toLowerCase().includes("код") ||
      codeMatch
    ) {
      if (codeMatch) {
        const code = codeMatch[0];

        if (code === MODERATOR_CODE) {
          response.response.text =
            "Аккаунт успешно привязан! (Режим проверки). Теперь вы можете диктовать мне свой вес.";
          response.response.end_session = false;
          response.session_state = { is_moderator: true };
          moderatorSessions.add(sessionId);
          return NextResponse.json(response);
        }

        const success = await linkAliceAccount(aliceUserId, code);
        if (success) {
          response.response.text =
            "Аккаунт успешно привязан! Теперь вы можете диктовать мне свой вес.";
          response.response.end_session = true;
          return NextResponse.json(response);
        } else {
          response.response.text =
            "Неверный код или срок его действия истек. Попробуйте получить новый код у бота.";
          response.response.end_session = true;
          return NextResponse.json(response);
        }
      } else {
        response.response.text =
          "Чтобы связать аккаунт, скажите 'Связать' и назовите 6-значный код из Telegram бота.";
        return NextResponse.json(response);
      }
    }

    if (!userData && !isModeratorSession) {
      response.response.text =
        "Я вас пока не знаю. Получите код привязки в Telegram боте и скажите мне: 'Связать аккаунт [код]'.";
      return NextResponse.json(response);
    }

    const { userId, timezone } = userData || { userId: 0, timezone: "UTC" };

    const weightData = parseWeightCommand(originalUtterance);
    if (weightData) {
      if (!isModeratorSession) {
        const today =
          timezone && isValidTimeZone(timezone)
            ? formatDateInTimeZone(new Date(), timezone)
            : formatDateLocal(new Date());

        await upsertWeightEntry({
          userId,
          date: today,
          period: weightData.period,
          weightKg: weightData.weight,
        });
      }

      const periodLabel = weightData.period === "morning" ? "утренний" : "вечерний";
      const debugSuffix = isModeratorSession ? " (Тестовая запись, не сохранена)" : "";

      response.response.text = `Записала ${periodLabel} вес: ${weightData.weight} кг.${debugSuffix}`;
      response.response.end_session = true;
      return NextResponse.json(response);
    }

    const normalizedCommand = command.toLowerCase();

    if (
      (body.session.new && !command) ||
      normalizedCommand === "привет" ||
      normalizedCommand.includes("запиши") ||
      normalizedCommand.includes("записать") ||
      normalizedCommand.includes("старт") ||
      normalizedCommand.includes("меню") ||
      normalizedCommand.includes("вес")
    ) {
      if (normalizedCommand.includes("утренний") || normalizedCommand.includes("утро")) {
        response.response.text = "Привет! Диктуйте утренний вес.";
      } else if (normalizedCommand.includes("вечерний") || normalizedCommand.includes("вечер")) {
        response.response.text = "Привет! Диктуйте вечерний вес.";
      } else {
        response.response.text = "Привет! Диктуйте утренний или вечерний вес.";
      }
      return NextResponse.json(response);
    }

    response.response.text = "Не поняла команду. Скажите, например: 'Вес утро 75 и 5'";
    return NextResponse.json(response);
  } catch (error) {
    console.error("Alice Webhook Error:", error);
    return NextResponse.json(
      {
        version: "1.0",
        response: {
          text: "Произошла ошибка на сервере.",
          end_session: true,
        },
      },
      { status: 200 }
    );
  }
}
