import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanWorkoutBlock } from "@/app/(protected)/plan/PlanClient/components/PlanWorkoutBlock/PlanWorkoutBlock";

describe("PlanWorkoutBlock", () => {
  it("не вставляет произвольную разметку из задания и комментария, сохраняя rich text", () => {
    const { container } = render(
      <PlanWorkoutBlock
        index={0}
        workoutsCount={1}
        workout={{
          id: 1,
          sessionOrder: 1,
          hasReport: false,
          taskText:
            '<div>Разминка<br><span style="font-weight: bold;color: #00AA11;">Бег &lt; 150</span></div><ul><li>Серия</li></ul>',
          commentText: '<span title="заметка">Легко</span><label for="other">Заминка</label>',
        }}
      />
    );

    const formatted = container.querySelector<HTMLSpanElement>("span[style]");
    expect(formatted?.textContent).toBe("Бег < 150");
    expect(formatted?.style.fontWeight).toBe("bold");
    expect(container.querySelector("br")).not.toBeNull();
    expect(container.querySelector("[title], label")).toBeNull();
    expect(container.textContent).toContain("Легко");
    expect(container.textContent).toContain("Заминка");
    expect(container.textContent).not.toContain("<ul>");
    expect(container.textContent).toContain("Серия");
  });
});
