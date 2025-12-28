import { buildWeightDateReplyKeyboard } from "@/bot/menu/menuKeyboard";
import {
  clearWeightDraft,
  clearWorkoutDraft,
  setPendingInput,
} from "@/bot/menu/menuState";

type WeightMenuActionArgs = {
  ctx: any;
  chatId: number;
};

export const handleWeightMenuAction = async ({
  ctx,
  chatId,
}: WeightMenuActionArgs) => {
  clearWeightDraft(chatId);
  clearWorkoutDraft(chatId);
  setPendingInput(chatId, "weightDateMenu");
  await ctx.reply("Когда зафиксировать вес?", {
    reply_markup: buildWeightDateReplyKeyboard(),
  });
};
