import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ConfigProvider } from "antd";
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import { ReleaseNotes } from "@/components/ReleaseNotes/ReleaseNotes";

const RELEASE_NOTES = {
  version: "1.3.0",
  sections: [
    { title: null, items: ["Улучшена работа приложения."] },
    { title: "Новое", items: ["Добавлен дневник.", "Появились результаты клуба."] },
    { title: "Исправления", items: ["Исправлено сохранение плана."] },
  ],
};

function renderReleaseNotes(props: ComponentProps<typeof ReleaseNotes>) {
  return render(
    <ConfigProvider theme={{ token: { motion: false } }}>
      <ReleaseNotes {...props} />
    </ConfigProvider>
  );
}

describe("ReleaseNotes", () => {
  it("показывает доступную кнопку версии и не открывает окно автоматически", () => {
    renderReleaseNotes({ versionLabel: "версия 1.3.0-a4672b2", releaseNotes: RELEASE_NOTES });

    const trigger = screen.getByRole("button", { name: /версия 1\.3\.0-a4672b2/ });
    expect(trigger.textContent).toBe("версия 1.3.0-a4672b2");
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("по нажатию открывает описание переданной версии с группами и пунктами", async () => {
    renderReleaseNotes({ versionLabel: "версия 1.3.0-a4672b2", releaseNotes: RELEASE_NOTES });

    fireEvent.click(screen.getByRole("button", { name: /версия 1\.3\.0-a4672b2/ }));

    const dialog = await screen.findByRole("dialog", { name: "Что нового в 1.3.0" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(within(dialog).getByRole("heading", { name: "Новое" })).toBeTruthy();
    expect(within(dialog).getByRole("heading", { name: "Исправления" })).toBeTruthy();
    expect(
      within(dialog)
        .getAllByRole("listitem")
        .map((item) => item.textContent)
    ).toEqual([
      "Улучшена работа приложения.",
      "Добавлен дневник.",
      "Появились результаты клуба.",
      "Исправлено сохранение плана.",
    ]);
  });

  it.each(["кнопкой", "крестиком", "Escape"])(
    "закрывает окно %s и возвращает фокус к версии",
    async (method) => {
      renderReleaseNotes({ versionLabel: "версия 1.3.0", releaseNotes: RELEASE_NOTES });

      const trigger = screen.getByRole("button", { name: /версия 1\.3\.0/ });
      trigger.focus();
      fireEvent.click(trigger);
      const dialog = await screen.findByRole("dialog", { name: "Что нового в 1.3.0" });

      if (method === "Escape") {
        fireEvent.keyDown(dialog, { key: "Escape", code: "Escape", keyCode: 27 });
      } else if (method === "крестиком") {
        fireEvent.click(within(dialog).getByRole("button", { name: "Закрыть окно" }));
      } else {
        fireEvent.click(within(dialog).getByRole("button", { name: "Закрыть" }));
      }

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).toBeNull();
        expect(document.activeElement).toBe(trigger);
      });
    }
  );

  it.each(["dev-сборка", "версия 9.0.0"])(
    "оставляет %s обычным текстом при отсутствии описания",
    (versionLabel) => {
      const { container } = renderReleaseNotes({ versionLabel, releaseNotes: null });

      expect(container.textContent).toBe(versionLabel);
      expect(container.firstElementChild?.tagName).toBe("SPAN");
      expect(screen.queryByRole("button")).toBeNull();
      expect(screen.queryByRole("dialog")).toBeNull();
    }
  );

  it.each([false, true])("удерживает фокус на границе окна при Shift=%s", async (shiftKey) => {
    renderReleaseNotes({ versionLabel: "версия 1.3.0", releaseNotes: RELEASE_NOTES });
    fireEvent.click(screen.getByRole("button", { name: /версия 1\.3\.0/ }));

    const dialog = await screen.findByRole("dialog", { name: "Что нового в 1.3.0" });
    const first = within(dialog).getByRole("button", { name: "Закрыть окно" });
    const last = within(dialog).getByRole("button", { name: "Закрыть" });
    const start = shiftKey ? first : last;
    const destination = shiftKey ? last : first;
    start.focus();

    expect(fireEvent.keyDown(start, { key: "Tab", shiftKey })).toBe(false);
    expect(document.activeElement).toBe(destination);
  });

  it("показывает HTML в заголовках и пунктах как обычный текст", async () => {
    const title = '<img src="x" onerror="alert(1)">';
    const item = "<script>alert(1)</script>";
    renderReleaseNotes({
      versionLabel: "версия 1.3.0",
      releaseNotes: { version: "1.3.0", sections: [{ title, items: [item] }] },
    });

    fireEvent.click(screen.getByRole("button", { name: /версия 1\.3\.0/ }));

    const dialog = await screen.findByRole("dialog", { name: "Что нового в 1.3.0" });
    expect(within(dialog).getByRole("heading", { name: title })).toBeTruthy();
    expect(within(dialog).getByRole("listitem").textContent).toBe(item);
    expect(dialog.querySelector("img, script")).toBeNull();
  });
});
