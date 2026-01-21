import { buildWeightDateReplyKeyboard } from "@/bot/menu/menuKeyboard";
import { clearRecoveryDraft, clearWeightDraft, setPendingInput } from "@/bot/menu/menuState";

type WeightMenuActionArgs = {
  ctx: any;
  chatId: number;
};

export const handleWeightMenuAction = async ({ ctx, chatId }: WeightMenuActionArgs) => {
  clearRecoveryDraft(chatId);
  clearWeightDraft(chatId);
  setPendingInput(chatId, "weightDateMenu");
  await ctx.reply("Когда зафиксировать вес?", {
    reply_markup: buildWeightDateReplyKeyboard(),
  });
};
