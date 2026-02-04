import { describe, it, expect } from "vitest";
import { processTemplate } from "./templateEngine";
import type { DiaryResultTemplate } from "@/app/actions/diaryTemplates";

const createTemplate = (outputTemplate: string, schema: any[] = []): DiaryResultTemplate => ({
  id: 1,
  name: "Test Template",
  code: "TEST",
  matchPattern: null,
  schema,
  outputTemplate,
  isInline: false,
  calculations: [],
  userId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  sortOrder: 0,
  type: "common",
  level: "general",
});

describe("templateEngine", () => {
  describe("processTemplate", () => {
    it("должен заменять простые переменные", () => {
      const template = createTemplate("Hello {{name}}!");
      const values = { name: "World" };
      const result = processTemplate(template, values);
      expect(result).toBe("Hello World!");
    });

    it("должен корректно обрабатывать undefined переменные", () => {
      const template = createTemplate("Hello {{name}}!");
      const values = {};
      const result = processTemplate(template, values);
      expect(result).toBe("Hello !");
    });

    it("должен объединять значения списка через точку с запятой", () => {
      const template = createTemplate("List: {{items}}");
      const values = { items: ["A", "B", "C"] };
      const result = processTemplate(template, values);
      expect(result).toBe("List: A; B; C");
    });

    it("должен обрабатывать вычисление {{AVG_TIME(...)}}", () => {
      const template = createTemplate("Average: {{AVG_TIME(times)}}");
      const values = { times: ["1:00", "2:00"] };
      const result = processTemplate(template, values);
      expect(result).toBe("Average: 1:30");
    });

    it("должен обрабатывать вычисление {{SUM_TIME(...)}}", () => {
      const template = createTemplate("Total: {{SUM_TIME(times)}}");
      const values = { times: ["1:00", "0:30"] };
      const result = processTemplate(template, values);
      expect(result).toBe("Total: 1:30");
    });

    describe("Блоки", () => {
      it("должен обрабатывать {{#if variable}}...{{/if}} (truthy)", () => {
        const template = createTemplate("Start {{#if show}}Visible{{/if}} End");
        const values = { show: true };
        const result = processTemplate(template, values);
        expect(result).toBe("Start Visible End");
      });

      it("должен обрабатывать {{#if variable}}...{{/if}} (falsy)", () => {
        const template = createTemplate("Start {{#if show}}Hidden{{/if}} End");
        const values = { show: false };
        const result = processTemplate(template, values);
        expect(result).toBe("Start  End");
      });

      it("должен обрабатывать {{#repeat count}}...{{/repeat}} через переменную", () => {
        const template = createTemplate("Rep: {{#repeat count}}x{{/repeat}}");
        const values = { count: 3 };
        const result = processTemplate(template, values);
        expect(result).toBe("Rep: xxx");
      });

      it("должен обрабатывать {{#each list}}...{{/each}}", () => {
        const template = createTemplate("Items: {{#each items}}[{{this}}]{{/each}}");
        const values = { items: ["A", "B"] };
        const result = processTemplate(template, values);
        expect(result).toBe("Items: [A][B]");
      });

      it("должен предоставлять @index и @total в циклах", () => {
        const template = createTemplate(
          "Values: {{#each items}}{{@index}}/{{@total}}:{{this}} {{/each}}"
        );
        const values = { items: ["A", "B"] };
        const result = processTemplate(template, values);
        expect(result).toBe("Values: 0/2:A 1/2:B ");
      });
    });

    describe("Вложенная сложная логика", () => {
      it("должен обрабатывать вложенные циклы", () => {
        const template = createTemplate(
          "{{#each groups}}Grp:{{name}} [{{#each items}}{{this}}-{{/each}}] {{/each}}"
        );
        const values = {
          groups: [
            { name: "G1", items: [1, 2] },
            { name: "G2", items: [3] },
          ],
        };
        const result = processTemplate(template, values);
        expect(result).toBe("Grp:G1 [1-2-] Grp:G2 [3-] ");
      });
    });

    describe("Обработка схемы", () => {
      it("должен разбивать строковый ввод на массив для полей типа list", () => {
        const template = createTemplate("{{items}}", [{ key: "items", type: "list" }]);
        const values = { items: "A; B; C" };
        const result = processTemplate(template, values);
        expect(result).toBe("A; B; C");

        const templateLoop = createTemplate("{{#each items}}{{this}}|{{/each}}", [
          { key: "items", type: "list" },
        ]);
        const resultLoop = processTemplate(templateLoop, values);
        expect(resultLoop).toBe("A|B|C|");
      });

      it("должен обрабатывать параллельный доступ к массиву используя [i]", () => {
        const template = createTemplate("{{#each names}}{{this}}:{{scores[i]}};{{/each}}");
        const values = {
          names: ["Alice", "Bob"],
          scores: [10, 20],
        };
        const result = processTemplate(template, values);
        expect(result).toBe("Alice:10;Bob:20;");
      });

      it("должен поддерживать доступ по индексу (с 1)", () => {
        const template = createTemplate("First: {{list[1]}}, Second: {{list[2]}}");
        const values = { list: ["A", "B", "C"] };
        const result = processTemplate(template, values);
        expect(result).toBe("First: A, Second: B");
      });
    });

    describe("Форматирование времени", () => {
      it("должен форматировать среднее время с миллисекундами", () => {
        const template = createTemplate("Avg: {{AVG_TIME(times)}}");
        const values = { times: ["0:01.5", "0:02"] };
        const result = processTemplate(template, values);
        expect(result).toBe("Avg: 0:01,8");
      });

      it("должен рассчитывать AVG_TIME с множеством аргументов (список + одиночное)", () => {
        const template = createTemplate("Avg: {{AVG_TIME(list, single)}}");
        const values = { list: ["1:00", "2:00"], single: "3:00" };
        const result = processTemplate(template, values);
        expect(result).toBe("Avg: 2:00");
      });

      it("должен рассчитывать SUM_TIME с множеством аргументов", () => {
        const template = createTemplate("Sum: {{SUM_TIME(t1, t2)}}");
        const values = { t1: "0:30", t2: "0:30" };
        const result = processTemplate(template, values);
        expect(result).toBe("Sum: 1:00");
      });
    });

    describe("Числовые функции", () => {
      it("должен рассчитывать AVG_NUM для списка", () => {
        const template = createTemplate("Avg Pulse: {{AVG_NUM(pulse)}}");
        const values = { pulse: [140, 150, 160] };
        const result = processTemplate(template, values);
        expect(result).toBe("Avg Pulse: 150");
      });

      it("должен рассчитывать AVG_NUM для смешанных данных (список + одиночное)", () => {
        const template = createTemplate("Avg: {{AVG_NUM(list, single)}}");
        const values = { list: [10, 20], single: 30 };
        const result = processTemplate(template, values);
        expect(result).toBe("Avg: 20");
      });

      it("должен рассчитывать SUM_NUM", () => {
        const template = createTemplate("Total: {{SUM_NUM(dist)}}");
        const values = { dist: [5, 5.5] };
        const result = processTemplate(template, values);
        expect(result).toBe("Total: 10.5");
      });
    });

    describe("Расчет PACE (темпа)", () => {
      it("должен рассчитывать PACE из времени и дистанции", () => {
        const template = createTemplate("Pace: {{PACE(time, dist)}}");
        const values = { time: "45:00", dist: "10000" };
        const result = processTemplate(template, values);
        expect(result).toBe("Pace: 4:30");
      });

      it("должен обрабатывать запятые в дистанции", () => {
        const template = createTemplate("Pace: {{PACE(time, dist)}}");
        const values = { time: "22:30", dist: "5000" };
        const result = processTemplate(template, values);
        expect(result).toBe("Pace: 4:30");
      });

      it("должен обрабатывать сырые строки в PACE (fallback логика)", () => {
        const template = createTemplate("Pace: {{PACE(time, 10000)}}");
        const values = { time: "50:00" };
        const result = processTemplate(template, values);
        expect(result).toBe("Pace: 5:00");
      });
    });

    describe("Расчет AVG_HEIGHT", () => {
      it("должен рассчитывать среднюю высоту", () => {
        const template = createTemplate("Avg Height: {{AVG_HEIGHT(height, dist)}}");
        const values = { height: 100, dist: 10000 };
        const result = processTemplate(template, values);
        expect(result).toBe("Avg Height: 10");
      });

      it("должен округлять до десятых", () => {
        const template = createTemplate("Avg: {{AVG_HEIGHT(500, 12000)}}");
        const values = {};
        const result = processTemplate(template, values);
        expect(result).toBe("Avg: 41,7");
      });

      it("должен обрабатывать строковые значения с запятой", () => {
        const template = createTemplate("Avg: {{AVG_HEIGHT(height, dist)}}");
        const values = { height: "100,5", dist: "10000" };
        const result = processTemplate(template, values);
        expect(result).toBe("Avg: 10,1");
      });
    });
    describe("Умный вес и дистанция", () => {
      it("должен использовать вес поля для расчета PACE, если дистанция не указана", () => {
        const template = createTemplate("Pace: {{PACE(time)}}", [
          { key: "time", type: "time", weight: 2000 } as any,
        ]);
        const values = { time: "08:00" };
        const result = processTemplate(template, values);
        expect(result).toBe("Pace: 4:00");
      });

      it("должен конвертировать метры в км для PACE (явная дистанция > 50)", () => {
        const template = createTemplate("Pace: {{PACE(time, dist)}}");
        const values = { time: "04:00", dist: "2000" };
        const result = processTemplate(template, values);
        expect(result).toBe("Pace: 2:00");
      });

      it("должен предоставлять доступ к переменной веса {{key_weight}}", () => {
        const template = createTemplate("Weight: {{t_weight}}", [
          { key: "t", type: "time", weight: 500 } as any,
        ]);
        const values = { t: "01:30" };
        const result = processTemplate(template, values);
        expect(result).toBe("Weight: 500");
      });

      it("должен использовать вес для AVG_HEIGHT и конвертировать метры в км", () => {
        const template = createTemplate("Height: {{AVG_HEIGHT(h)}}", [
          { key: "h", type: "text", weight: 10000 } as any,
        ]);
        const values = { h: "100" };
        const result = processTemplate(template, values);
        expect(result).toBe("Height: 10");
      });
    });
  });
});
