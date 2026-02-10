import { describe, it, expect } from "vitest";
import { matchTemplates } from "@/shared/utils/templateMatching";
import type { TemplateWithPattern } from "@/shared/utils/templateMatching";

const createTemplate = (id: number, pattern: string, sortOrder = 0): TemplateWithPattern => ({
  id,
  matchPattern: pattern,
  sortOrder,
  name: `Template ${id}`,
});

describe("templateMatching", () => {
  describe("Базовый поиск", () => {
    it("должен находить простое совпадение", () => {
      const t1 = createTemplate(1, "run");
      const result = matchTemplates([t1], "Go for a run today");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it("должен игнорировать регистр", () => {
      const t1 = createTemplate(1, "RUN");
      const result = matchTemplates([t1], "Go for a run");
      expect(result).toHaveLength(1);
    });
  });

  describe("Умный поиск (Ranges & Anchors)", () => {
    it("должен поддерживать диапазон #{min-max}", () => {
      const t1 = createTemplate(1, "#{5-10} km");

      expect(matchTemplates([t1], "Run 7 km")).toHaveLength(1);
      expect(matchTemplates([t1], "Run 4 km")).toHaveLength(0);
      expect(matchTemplates([t1], "Run 12 km")).toHaveLength(0);
    });

    it("должен поддерживать якорь ^ (начало строки)", () => {
      const t1 = createTemplate(1, "^Morning");

      expect(matchTemplates([t1], "Morning run")).toHaveLength(1);
      expect(matchTemplates([t1], "Good Morning")).toHaveLength(0);
    });

    it("должен обрабатывать символ # как любое число", () => {
      const t1 = createTemplate(1, "Run # km");
      expect(matchTemplates([t1], "Run 10 km")).toHaveLength(1);
      expect(matchTemplates([t1], "Run fast km")).toHaveLength(0);
    });
  });

  describe("Приоритеты и перекрытия", () => {
    it("должен выбирать более длинное совпадение (Longest Match)", () => {
      const tShort = createTemplate(1, "Run");
      const tLong = createTemplate(2, "Run fast");

      const result = matchTemplates([tShort, tLong], "Run fast match");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it("должен выбирать более раннее совпадение", () => {
      const t1 = createTemplate(1, "Hello");
      const t2 = createTemplate(2, "World");

      const result = matchTemplates([t1, t2], "Hello World");
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });

    it("не должен допускать перекрытия", () => {
      const t1 = createTemplate(1, "Run fast");
      const t2 = createTemplate(2, "fast");

      const result = matchTemplates([t1, t2], "Run fast");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });
  });

  describe("Сложные примеры пользователя", () => {
    it("должен находить сложный паттерн с кучей спецсимволов", () => {
      const pattern =
        "6x1 км(200 м(до 27)(47,5)+200 м-с.у.(40-42)+600 м(до 27)(2:22,5))(3:50)(через 1 мин. отдыха)";
      const t1 = createTemplate(1, pattern);

      const text =
        "Сегодня тренировка: 6x1 км(200 м(до 27)(47,5)+200 м-с.у.(40-42)+600 м(до 27)(2:22,5))(3:50)(через 1 мин. отдыха)";

      const result = matchTemplates([t1], text);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it("должен обрабатывать несколько шаблонов в одном тексте (список)", () => {
      const t1 = createTemplate(1, "3 км(до 22)");
      const t2 = createTemplate(2, "упражнения+50 м-б.у.");
      const t3 = createTemplate(3, "2x50 м-ускорения");

      const text =
        "Утро: 3 км(до 22)(пульс)+упражнения+50 м-б.у.(через ходьбу)+п.о.+2x50 м-ускорения";

      const result = matchTemplates([t1, t2, t3], text);
      const hasT1 = result.find((r) => r.id === 1);
      expect(hasT1).toBeDefined();

      const hasT2 = result.find((r) => r.id === 2);
      expect(hasT2).toBeDefined();

      const hasT3 = result.find((r) => r.id === 3);
      expect(hasT3).toBeDefined();
    });

    it("должен корректно работать с диапазонами вида 14x400", () => {
      const t1 = createTemplate(1, "#{10-15}x400");

      expect(matchTemplates([t1], "14x400 м-с.к")).toHaveLength(1);
      expect(matchTemplates([t1], "8x400 м-с.к")).toHaveLength(0);
    });
    it("должен сохранять последующие совпадения после шаблона с подстановкой *", () => {
      const t1 = createTemplate(1, "15x400(*:*)");
      const t2 = createTemplate(2, "2x400(150+250)");
      const t3 = createTemplate(3, "#km(*:*-*:*)");

      const text = "15x400(1:24)+2x400(150+250)+2km(4:05-4:10)";
      const result = matchTemplates([t1, t2, t3], text);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
      expect(result[2].id).toBe(3);
    });

    it("должен матчить по второму паттерну, если первый в списке через ; не подошел", () => {
      const t1 = createTemplate(1, "foo bar;hello # km");
      const result = matchTemplates([t1], "warmup hello 5 km cool down");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it("не должен ломать подбор, когда у одного шаблона невалидный raw regex", () => {
      const broken = createTemplate(1, "(");
      const valid = createTemplate(2, "hello");
      const result = matchTemplates([broken, valid], "say hello");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it("должен нормализовать пробелы в smart паттерне", () => {
      const t1 = createTemplate(1, "Run    #   km");
      const result = matchTemplates([t1], "Run 10 km");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it("должен дедуплицировать совпадение одного шаблона из smart и raw веток", () => {
      const t1 = createTemplate(1, "Run # km;Run 10 km");
      const result = matchTemplates([t1], "Run 10 km");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it("должен привязывать якорь ^ только к началу всей строки", () => {
      const t1 = createTemplate(1, "^World");
      const result = matchTemplates([t1], "Hello\nWorld");

      expect(result).toHaveLength(0);
    });

    it("должен находить несколько шаблонов в комбинированной тренировке с темповыми и ускорениями", () => {
      const t100 = createTemplate(1, "#x100 м-близко к max в гору");
      const t200 = createTemplate(2, "#x200 м-с.у. в гору силовым бегом");
      const tTempo = createTemplate(3, "# км(до 27)(*:*)");
      const tTempoPulse = createTemplate(4, "# км(до 27)(*:*-*:*)(пульс)");

      const text =
        "4 км(до 27)(4:05)+3 мин. отдыха+12x200 м-с.у. в гору силовым бегом(через 200 м(до 22)(1:20-1:40))+3 мин. отдыха+4x100 м-близко к max в гору(через 2 мин. отдыха)+3 мин. отдыха+3 км(до 27)(4:05)(пульс)";

      const result = matchTemplates([t100, t200, tTempo, tTempoPulse], text);
      const ids = result.map((item) => item.id);

      expect(ids).toContain(1);
      expect(ids).toContain(2);
      expect(ids).toContain(3);
      expect(result.length).toBeGreaterThanOrEqual(3);
    });
  });
});
