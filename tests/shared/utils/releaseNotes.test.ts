import { describe, expect, it } from "vitest";
import { getReleaseMarkdown, getReleaseNotes } from "@/shared/utils/releaseNotes";

const CHANGELOG = `# История изменений

## [1.3.0](https://github.com/example/app/compare/v1.2.0...v1.3.0) (2026-10-22)

### Новое

* **Дневник:** добавлен [учёт сна](https://example.com/sleep).
* Поддержан \`get_user_data\` и *импорт*.

### Исправления

- Исправлено __сохранение__ плана.

## 1.2.0-beta (2026-10-01)

- Тестовая версия.

## 1.2.0

- Стабильная версия.
`;

describe("getReleaseNotes", () => {
  it("выбирает только установленную версию и преобразует Markdown в текст", () => {
    expect(getReleaseNotes(CHANGELOG, "1.3.0")).toEqual({
      version: "1.3.0",
      sections: [
        {
          title: "Новое",
          items: ["Дневник: добавлен учёт сна.", "Поддержан get_user_data и импорт."],
        },
        { title: "Исправления", items: ["Исправлено сохранение плана."] },
      ],
    });
  });

  it.each([
    ["1.3.0-a4672b2", "a4672b2", "1.3.0"],
    ["1.2.0-beta-3fc64f4", "3fc64f4", "1.2.0-beta"],
    ["1.2.0-beta", undefined, "1.2.0-beta"],
  ])("сопоставляет %s с %s без потери prerelease", (version, sha, expected) => {
    expect(getReleaseNotes(CHANGELOG, version, sha)?.version).toBe(expected);
  });

  it.each([
    ["dev", undefined],
    ["9.0.0", undefined],
    ["1.3.0-a4672b2", undefined],
    ["1.3.0-a4672b2", "local"],
    ["1.3.0-a4672b2", "fffffff"],
    ["1.2.0-beta-3fc64f4", "3fc64"],
  ])("не подставляет другой релиз для %s и SHA %s", (version, sha) => {
    expect(getReleaseNotes(CHANGELOG, version, sha)).toBeNull();
  });

  it("не подменяет prerelease стабильной версией", () => {
    expect(getReleaseNotes("## 1.2.0\n- Stable", "1.2.0-beta")).toBeNull();
  });

  it.each(["# История изменений", "## 1.3.0", "## 1.3.0\n### Новое", "## 1.3.0\n- ** **"])(
    "возвращает null для отсутствующего или пустого описания",
    (changelog) => {
      expect(getReleaseNotes(changelog, "1.3.0")).toBeNull();
    }
  );

  it("пропускает пустые группы и поддерживает пункты без группы", () => {
    expect(
      getReleaseNotes("## 1.3.0\n- Общее\n### Пусто\n### **Новое**\n* Дневник", "1.3.0")
    ).toEqual({
      version: "1.3.0",
      sections: [
        { title: null, items: ["Общее"] },
        { title: "Новое", items: ["Дневник"] },
      ],
    });
  });

  it("поддерживает переносы пунктов и CRLF", () => {
    expect(
      getReleaseNotes("## 1.3.0\r\n- Длинный пункт\r\n  с продолжением.\r\n", "1.3.0")?.sections
    ).toEqual([{ title: null, items: ["Длинный пункт с продолжением."] }]);
  });

  it("сохраняет HTML как текст для безопасного отображения в React", () => {
    const html = '<img src="x" onerror="alert(1)">';
    expect(getReleaseNotes(`## 1.3.0\n- ${html}`, "1.3.0")?.sections[0].items).toEqual([html]);
  });

  it("отклоняет дублированную секцию версии", () => {
    expect(() => getReleaseNotes("## 1.3.0\n- Один\n## [1.3.0](url)\n- Два", "1.3.0")).toThrow(
      /1\.3\.0/
    );
  });
});

describe("getReleaseMarkdown", () => {
  it("возвращает исходное описание для GitHub без заголовка и других версий", () => {
    expect(getReleaseMarkdown(CHANGELOG, "1.3.0")).toBe(
      "### Новое\n\n* **Дневник:** добавлен [учёт сна](https://example.com/sleep).\n" +
        "* Поддержан `get_user_data` и *импорт*.\n\n### Исправления\n\n- Исправлено __сохранение__ плана."
    );
  });

  it("не смешивает версии с одинаковым началом", () => {
    expect(getReleaseMarkdown("## 1.3.00\n- Другой релиз\n## 1.3.0\n- Нужный", "1.3.0")).toBe(
      "- Нужный"
    );
  });
});
