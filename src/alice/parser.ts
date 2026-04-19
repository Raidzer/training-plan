import type { AliceWeightCommand, AliceWeightPeriod } from "./types";

export function parseWeightCommand(text: string): AliceWeightCommand | null {
  const lowerText = text.toLowerCase();

  let period: AliceWeightPeriod = "morning";
  if (lowerText.includes("РІРµС‡РµСЂ") || lowerText.includes("РІРµС‡РµСЂРѕРј")) {
    period = "evening";
  }

  const cleanText = lowerText
    .replace("СЃ РїРѕР»РѕРІРёРЅРѕР№", ".5")
    .replace(" СЃ ", ".")
    .replace(" Рё ", ".")
    .replace(/,/g, ".");

  const weightMatch = cleanText.match(/(\d{2,3}(?:\.\d{1,2})?)/);
  if (!weightMatch) {
    return null;
  }

  const weight = parseFloat(weightMatch[1]);
  if (isNaN(weight) || weight < 30 || weight > 200) {
    return null;
  }

  return { weight, period };
}
