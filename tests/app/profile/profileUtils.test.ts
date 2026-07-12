import { describe, expect, it, vi } from "vitest";
import dayjs from "dayjs";

import { DEFAULT_TIMEZONE } from "@/shared/constants/timezones";
import {
  hasProfileValuesChanged,
  canDeleteProfileRole,
  getProfileDisplayName,
  getProfileInitials,
  getProfileRoleLabel,
  normalizeProfileUserData,
  normalizeProfileValues,
  readJson,
  toProfileFormValues,
} from "@/app/(protected)/profile/ProfileClient/utils/profileUtils";
import type {
  ProfileApiUserData,
  ProfileFormValues,
  ProfileUserData,
} from "@/app/(protected)/profile/ProfileClient/types/profileTypes";

describe("profileUtils", () => {
  it("normalizes profile form values before submit", () => {
    const values: ProfileFormValues = {
      name: "  Иван  ",
      lastName: "  Петров  ",
      patronymic: "  Иванович  ",
      heightCm: 180,
      weeklyWorkloadCount: 5,
      gender: "male",
      dateOfBirth: dayjs("1990-04-12"),
      occupation: "work",
      miscellaneous: "  Бег по выходным  ",
      timezone: "Europe/Moscow",
    };

    expect(normalizeProfileValues(values)).toEqual({
      name: "Иван",
      lastName: "Петров",
      patronymic: "Иванович",
      heightCm: 180,
      weeklyWorkloadCount: 5,
      gender: "male",
      dateOfBirth: "1990-04-12",
      occupation: "work",
      miscellaneous: "Бег по выходным",
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
      patronymic: "",
      heightCm: null,
      weeklyWorkloadCount: null,
      gender: "unknown",
      dateOfBirth: null,
      occupation: "unknown",
      miscellaneous: "",
      timezone: "",
      role: "athlete",
    };

    const formValues = toProfileFormValues(userData);

    expect(formValues).toEqual({
      name: "Анна",
      lastName: "",
      patronymic: "",
      heightCm: null,
      weeklyWorkloadCount: null,
      gender: "male",
      dateOfBirth: null,
      occupation: null,
      miscellaneous: "",
      timezone: DEFAULT_TIMEZONE,
    });
  });

  it("detects meaningful profile changes after normalization", () => {
    const currentValues: ProfileFormValues = {
      name: "Иван",
      lastName: "Петров",
      patronymic: "Иванович",
      heightCm: 180,
      weeklyWorkloadCount: 5,
      gender: "male",
      dateOfBirth: dayjs("1990-04-12"),
      occupation: "work",
      miscellaneous: "Бег по выходным",
      timezone: "Europe/Moscow",
    };

    expect(
      hasProfileValuesChanged(
        {
          name: "  Иван ",
          lastName: "Петров  ",
          patronymic: " Иванович ",
          heightCm: 180,
          weeklyWorkloadCount: 5,
          gender: "male",
          dateOfBirth: dayjs("1990-04-12"),
          occupation: "work",
          miscellaneous: "  Бег по выходным  ",
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
          patronymic: "Иванович",
          heightCm: 180,
          weeklyWorkloadCount: 5,
          gender: "male",
          dateOfBirth: dayjs("1990-04-12"),
          occupation: "work",
          miscellaneous: "Бег по выходным",
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
      patronymic: null,
      heightCm: null,
      weeklyWorkloadCount: null,
      gender: "male",
      dateOfBirth: "1990-04-12",
      occupation: "study",
      miscellaneous: null,
      timezone: "Europe/Moscow",
      role: "coach",
    };

    expect(normalizeProfileUserData(userData)).toEqual({
      id: "42",
      email: "runner@example.com",
      login: "runner",
      name: "Иван",
      lastName: "",
      patronymic: "",
      heightCm: null,
      weeklyWorkloadCount: null,
      gender: "male",
      dateOfBirth: "1990-04-12",
      occupation: "study",
      miscellaneous: "",
      timezone: "Europe/Moscow",
      role: "coach",
    });
  });

  it("разрешает удаление только неадминистративного профиля", () => {
    expect(canDeleteProfileRole("athlete")).toBe(true);
    expect(canDeleteProfileRole("coach")).toBe(true);
    expect(canDeleteProfileRole("admin")).toBe(false);
  });

  it("подготавливает отображаемые данные для паспорта спортсмена", () => {
    expect(
      getProfileDisplayName({
        name: " Иван ",
        lastName: " Петров ",
        login: "runner",
      })
    ).toBe("Иван Петров");
    expect(
      getProfileInitials({
        name: " Иван ",
        lastName: " Петров ",
        login: "runner",
      })
    ).toBe("ИП");
    expect(
      getProfileInitials({
        name: "",
        lastName: "",
        login: "runner",
      })
    ).toBe("RU");
    expect(
      getProfileDisplayName({
        name: "",
        lastName: "",
        login: "runner",
      })
    ).toBe("runner");
    expect(getProfileRoleLabel("coach")).toBe("Тренер");
    expect(getProfileRoleLabel("unknown")).toBe("Участник клуба");
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
