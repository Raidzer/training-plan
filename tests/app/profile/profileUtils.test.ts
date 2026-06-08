import { describe, expect, it, vi } from "vitest";

import { DEFAULT_TIMEZONE } from "@/shared/constants/timezones";
import {
  hasProfileValuesChanged,
  normalizeProfileUserData,
  normalizeProfileValues,
  readJson,
  toProfileFormValues,
} from "@/app/profile/ProfileClient/utils/profileUtils";
import type {
  ProfileApiUserData,
  ProfileFormValues,
  ProfileUserData,
} from "@/app/profile/ProfileClient/types/profileTypes";

describe("profileUtils", () => {
  it("normalizes profile form values before submit", () => {
    const values: ProfileFormValues = {
      name: "  Иван  ",
      lastName: "  Петров  ",
      gender: "male",
      timezone: "Europe/Moscow",
    };

    expect(normalizeProfileValues(values)).toEqual({
      name: "Иван",
      lastName: "Петров",
      gender: "male",
      timezone: "Europe/Moscow",
    });
  });

  it("uses safe defaults when converting user data to form values", () => {
    const userData: ProfileUserData = {
      id: "1",
      email: "runner@example.com",
      login: "runner",
      name: "Анна",
      lastName: "",
      gender: "unknown",
      timezone: "",
    };

    expect(toProfileFormValues(userData)).toEqual({
      name: "Анна",
      lastName: "",
      gender: "male",
      timezone: DEFAULT_TIMEZONE,
    });
  });

  it("detects meaningful profile changes after normalization", () => {
    const currentValues: ProfileFormValues = {
      name: "Иван",
      lastName: "Петров",
      gender: "male",
      timezone: "Europe/Moscow",
    };

    expect(
      hasProfileValuesChanged(
        {
          name: "  Иван ",
          lastName: "Петров  ",
          gender: "male",
          timezone: "Europe/Moscow",
        },
        currentValues
      )
    ).toBe(false);

    expect(
      hasProfileValuesChanged(
        {
          name: "Иван",
          lastName: "Сидоров",
          gender: "male",
          timezone: "Europe/Moscow",
        },
        currentValues
      )
    ).toBe(true);
  });

  it("normalizes API user data shape for profile state", () => {
    const userData: ProfileApiUserData = {
      id: 42,
      email: "runner@example.com",
      login: "runner",
      name: "Иван",
      lastName: null,
      gender: "male",
      timezone: "Europe/Moscow",
    };

    expect(normalizeProfileUserData(userData)).toEqual({
      id: "42",
      email: "runner@example.com",
      login: "runner",
      name: "Иван",
      lastName: "",
      gender: "male",
      timezone: "Europe/Moscow",
    });
  });

  it("reads JSON response and falls back to null for invalid JSON", async () => {
    const response = new Response(JSON.stringify({ ok: true }));

    await expect(readJson<{ ok: boolean }>(response)).resolves.toEqual({
      ok: true,
    });

    const invalidResponse = {
      json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
    } as unknown as Response;

    await expect(readJson<{ ok: boolean }>(invalidResponse)).resolves.toBeNull();
  });
});
