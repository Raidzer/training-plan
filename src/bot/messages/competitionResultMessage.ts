import { InlineKeyboard } from "grammy";
import type { CompetitionRecord } from "@/server/competitions";
import { formatCompetitionDate } from "@/shared/utils/competitionUtils";
import { COMPETITION_RESULT_TEXT } from "@/bot/constants/competitionResultConstants";

type CompetitionSummary = Pick<CompetitionRecord, "date" | "nameLocation" | "distanceLabel">;

const formatCompetitionSummary = (competition: CompetitionSummary) =>
  `«${competition.nameLocation}», ${competition.distanceLabel}, ${formatCompetitionDate(competition.date)}`;

export const formatCompetitionResultRequest = (competition: CompetitionSummary) =>
  `Как прошло соревнование ${formatCompetitionSummary(competition)}?\n\nУкажите результат или отметьте, что пропустили старт.`;

export const formatCompetitionResultPrompt = (competition: CompetitionSummary) =>
  `${COMPETITION_RESULT_TEXT.promptPrefix} ${formatCompetitionSummary(competition)}.\n\nОтправьте ответ на это сообщение: MM:SS или HH:MM:SS, например 39:30 или 01:42:15. Можно указать десятые и сотые.`;

export const buildCompetitionResultKeyboard = (requestId: number) =>
  new InlineKeyboard()
    .text("Указать результат", `competition:${requestId}:result`)
    .row()
    .text("Пропустил", `competition:${requestId}:skip`);

export const buildCompetitionRecordKeyboard = (requestId: number) =>
  new InlineKeyboard()
    .text("Сохранить рекорд", `competition:${requestId}:record`)
    .row()
    .text("Не сейчас", `competition:${requestId}:dismiss`);

export const formatCompetitionRecordOffer = (params: {
  competition: CompetitionSummary;
  timeText: string;
  previousTimeText: string | null;
}) => {
  const heading = params.previousTimeText
    ? `Поздравляем с новым личным рекордом!\n${params.previousTimeText} → ${params.timeText}`
    : `Это ваш первый личный рекорд на этой дистанции: ${params.timeText}!`;

  return `${heading}\n\n${formatCompetitionSummary(params.competition)}.\n\nСохранить в личные рекорды? Перенесём время, дату и название соревнования. Прежние город и ссылка на протокол будут очищены.`;
};
