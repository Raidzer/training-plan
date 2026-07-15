import { describe, expect, it } from "vitest";
import { DEFAULT_AUTH_REDIRECT, getInternalAuthRedirect } from "@/shared/utils/authRedirect";

describe("getInternalAuthRedirect", () => {
  it("сохраняет внутренний путь, query и hash", () => {
    expect(getInternalAuthRedirect("/dashboard?from=login#summary")).toBe(
      "/dashboard?from=login#summary"
    );
  });

  it("убирает origin и устаревший dev-порт из абсолютного URL", () => {
    expect(getInternalAuthRedirect("http://localhost:3000/dashboard?from=auth")).toBe(
      "/dashboard?from=auth"
    );
  });

  it("использует fallback для пустого и небезопасного URL", () => {
    expect(getInternalAuthRedirect(null)).toBe(DEFAULT_AUTH_REDIRECT);
    expect(getInternalAuthRedirect("javascript:alert(1)")).toBe(DEFAULT_AUTH_REDIRECT);
  });
});
