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
  version: string;
};

type AliceResponse = {
  version: string;
  session: any;
  response: {
    text: string;
    end_session: boolean;
  };
};

export async function POST(req: NextRequest) {
  try {
    const body: AliceRequest = await req.json();
    const aliceUserId = body.session.user.user_id;
    const command = body.request.command;
    const originalUtterance = body.request.original_utterance;

    const response: AliceResponse = {
      version: body.version,
      session: body.session,
      response: {
        text: "Я вас не поняла.",
        end_session: false,
      },
    };

    const userData = await getUserIdByAliceId(aliceUserId);

    const codeMatch = command.match(/\d{6}/);
    if (
      command.toLowerCase().includes("связать") ||
      command.toLowerCase().includes("код") ||
      codeMatch
    ) {
      if (codeMatch) {
        const code = codeMatch[0];
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

    if (!userData) {
      response.response.text =
        "Я вас пока не знаю. Получите код привязки в Telegram боте и скажите мне: 'Связать аккаунт [код]'.";
      return NextResponse.json(response);
    }

    const { userId, timezone } = userData;

    if (body.session.new && !command) {
      response.response.text = "Привет! Жду ваш вес (утро или вечер).";
      return NextResponse.json(response);
    }

    const weightData = parseWeightCommand(originalUtterance);
    if (weightData) {
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

      const periodLabel = weightData.period === "morning" ? "утренний" : "вечерний";
      response.response.text = `Записала ${periodLabel} вес: ${weightData.weight} кг.`;
      response.response.end_session = true;
      return NextResponse.json(response);
    }

    response.response.text = "Не поняла команду. Скажите, например: 'Вес утро 75.5'";
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
