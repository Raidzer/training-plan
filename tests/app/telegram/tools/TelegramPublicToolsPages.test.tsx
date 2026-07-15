import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import TelegramPaceCalculatorPage from "@/app/telegram/tools/pace-calculator/page";
import TelegramResultEquivalentPage from "@/app/telegram/tools/result-equivalent/page";
import TelegramSpeedToPacePage from "@/app/telegram/tools/speed-to-pace/page";

const TELEGRAM_TOOL_PAGES = [
  {
    name: "прогноз результата",
    PageComponent: TelegramResultEquivalentPage,
    heading: "Прогноз результата на дистанции",
  },
  {
    name: "калькулятор темпа",
    PageComponent: TelegramPaceCalculatorPage,
    heading: "Темп, результат и раскладка",
  },
  {
    name: "конвертер скорости",
    PageComponent: TelegramSpeedToPacePage,
    heading: "Скорость и темп",
  },
] as const;

describe("Telegram public tools pages", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it.each(TELEGRAM_TOOL_PAGES)(
    "оставляет $name самостоятельным без публичной навигации",
    ({ PageComponent, heading }) => {
      render(<PageComponent />);

      expect(screen.getByRole("heading", { level: 1, name: heading })).toBeTruthy();
      expect(
        screen.queryByRole("navigation", { name: "Переключение беговых инструментов" })
      ).toBeNull();
    }
  );
});
