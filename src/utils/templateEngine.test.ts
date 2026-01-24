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
    it("should replace simple variables", () => {
      const template = createTemplate("Hello {{name}}!");
      const values = { name: "World" };
      const result = processTemplate(template, values);
      expect(result).toBe("Hello World!");
    });

    it("should handle undefined variables gracefully", () => {
      const template = createTemplate("Hello {{name}}!");
      const values = {};
      const result = processTemplate(template, values);
      expect(result).toBe("Hello !");
    });

    it("should join list values with semicolon", () => {
      const template = createTemplate("List: {{items}}");
      const values = { items: ["A", "B", "C"] };
      const result = processTemplate(template, values);
      expect(result).toBe("List: A; B; C");
    });

    it("should process {{AVG_TIME(...)}} calculation", () => {
      const template = createTemplate("Average: {{AVG_TIME(times)}}");
      const values = { times: ["1:00", "2:00"] };
      const result = processTemplate(template, values);
      expect(result).toBe("Average: 1:30");
    });

    it("should process {{SUM_TIME(...)}} calculation", () => {
      const template = createTemplate("Total: {{SUM_TIME(times)}}");
      const values = { times: ["1:00", "0:30"] };
      const result = processTemplate(template, values);
      expect(result).toBe("Total: 1:30");
    });

    describe("Blocks", () => {
      it("should handle {{#if variable}}...{{/if}} truthy", () => {
        const template = createTemplate("Start {{#if show}}Visible{{/if}} End");
        const values = { show: true };
        const result = processTemplate(template, values);
        expect(result).toBe("Start Visible End");
      });

      it("should handle {{#if variable}}...{{/if}} falsy", () => {
        const template = createTemplate("Start {{#if show}}Hidden{{/if}} End");
        const values = { show: false };
        const result = processTemplate(template, values);
        expect(result).toBe("Start  End");
      });

      it("should handle {{#repeat count}}...{{/repeat}} via variable", () => {
        const template = createTemplate("Rep: {{#repeat count}}x{{/repeat}}");
        const values = { count: 3 };
        const result = processTemplate(template, values);
        expect(result).toBe("Rep: xxx");
      });

      it("should handle {{#each list}}...{{/each}}", () => {
        const template = createTemplate("Items: {{#each items}}[{{this}}]{{/each}}");
        const values = { items: ["A", "B"] };
        const result = processTemplate(template, values);
        expect(result).toBe("Items: [A][B]");
      });

      it("should expose @index and @total in loops", () => {
        const template = createTemplate(
          "Values: {{#each items}}{{@index}}/{{@total}}:{{this}} {{/each}}"
        );
        const values = { items: ["A", "B"] };
        const result = processTemplate(template, values);
        expect(result).toBe("Values: 0/2:A 1/2:B ");
      });
    });

    describe("Nested Complex Logic", () => {
      it("should handle nested loops", () => {
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

    describe("Schema Processing", () => {
      it("should split string input into array for list type fields", () => {
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

      it("should handle parallel array access using [i]", () => {
        const template = createTemplate("{{#each names}}{{this}}:{{scores[i]}};{{/each}}");
        const values = {
          names: ["Alice", "Bob"],
          scores: [10, 20],
        };
        const result = processTemplate(template, values);
        expect(result).toBe("Alice:10;Bob:20;");
      });
    });

    describe("Time Formatting", () => {
      it("should format avg time with milliseconds", () => {
        const template = createTemplate("Avg: {{AVG_TIME(times)}}");
        // 1.5s + 2.0s = 3.5s / 2 = 1.75s -> 0:01,8 (rounded 1 decimal)
        const values = { times: ["0:01.5", "0:02"] };
        const result = processTemplate(template, values);
        // 1.75s -> 1s int, 0.75 * 10 = 7.5 -> 8
        expect(result).toBe("Avg: 0:01,8");
      });
    });
  });
});
