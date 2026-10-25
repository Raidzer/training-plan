import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { scrollPlanEntryIntoView } from "@/app/(protected)/plan/PlanClient/utils/planScrollUtils";

function createRect(top: number, bottom: number): DOMRect {
  return {
    x: 0,
    y: top,
    width: 320,
    height: bottom - top,
    top,
    right: 320,
    bottom,
    left: 0,
    toJSON: () => ({}),
  };
}

describe("planScrollUtils", () => {
  it("повторяет smooth-прокрутку через fallback для браузера без scrollend", async () => {
    const scrollEndDescriptor = Object.getOwnPropertyDescriptor(window, "onscrollend");
    Reflect.deleteProperty(window, "onscrollend");

    const target = document.createElement("div");
    document.body.append(target);
    let correctionApplied = false;
    const scrollIntoViewMock = vi
      .spyOn(target, "scrollIntoView")
      .mockImplementation((options?: boolean | ScrollIntoViewOptions) => {
        if (
          typeof options === "object" &&
          options.behavior === "smooth" &&
          scrollIntoViewMock.mock.calls.length === 2
        ) {
          correctionApplied = true;
        }
      });
    vi.spyOn(target, "getBoundingClientRect").mockImplementation(() =>
      correctionApplied ? createRect(200, 500) : createRect(900, 1200)
    );
    const onComplete = vi.fn();
    let cleanup = () => {};

    try {
      cleanup = scrollPlanEntryIntoView(target, onComplete);
      expect(scrollIntoViewMock).toHaveBeenNthCalledWith(1, {
        block: "center",
        behavior: "smooth",
      });

      document.dispatchEvent(new Event("scroll"));

      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalledTimes(2);
      });
      expect(scrollIntoViewMock).toHaveBeenNthCalledWith(2, {
        block: "center",
        behavior: "smooth",
      });

      document.dispatchEvent(new Event("scroll"));

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledOnce();
      });
      expect(scrollIntoViewMock).toHaveBeenCalledTimes(2);
    } finally {
      cleanup();
      target.remove();
      if (scrollEndDescriptor) {
        Object.defineProperty(window, "onscrollend", scrollEndDescriptor);
      }
    }
  });
});
