import { describe, expect, it } from "vitest";

import { shoesLabels } from "@/app/(protected)/profile/shoes/ShoesClient/constants/shoesConstants";
import {
  createEmptyForm,
  createFormFromShoe,
  formatMileageInputValue,
  formatMileageValue,
  formatNotifications,
  getPairCountLabel,
  getShoeMileageProgress,
  getShoeFromResponse,
  getShoesFromResponse,
  validateMileageLimit,
  validateName,
} from "@/app/(protected)/profile/shoes/ShoesClient/utils/shoesUtils";
import type { ShoeItem } from "@/app/(protected)/profile/shoes/ShoesClient/types/shoesTypes";

function createShoe(overrides: Partial<ShoeItem> = {}): ShoeItem {
  return {
    id: 1,
    name: "Daily Trainer",
    mileageLimitKm: "800.5",
    currentMileageKm: "125.25",
    notifyOnLimitEmail: true,
    notifyOnLimitTelegram: false,
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("shoesUtils", () => {
  it("validates shoe name and trims successful value", () => {
    expect(validateName("  Daily Trainer  ")).toEqual({
      ok: true,
      value: "Daily Trainer",
    });
    expect(validateName("  ")).toEqual({
      ok: false,
      error: shoesLabels.nameRequired,
    });
    expect(validateName("a".repeat(256))).toEqual({
      ok: false,
      error: shoesLabels.nameTooLong,
    });
  });

  it("validates mileage limit with comma support and two-decimal normalization", () => {
    expect(validateMileageLimit(" 12,345 ", undefined)).toEqual({
      ok: true,
      value: 12.35,
    });
    expect(validateMileageLimit("", null)).toEqual({
      ok: true,
      value: null,
    });
    expect(validateMileageLimit("-1", undefined)).toEqual({
      ok: false,
      error: shoesLabels.mileageInvalid,
    });
    expect(validateMileageLimit("100000", undefined)).toEqual({
      ok: false,
      error: shoesLabels.mileageInvalid,
    });
  });

  it("formats mileage values for table and form usage", () => {
    expect(formatMileageValue("12.5")).toBe("12,5 км");
    expect(formatMileageValue(null)).toBe(shoesLabels.mileageUnset);
    expect(formatMileageValue("invalid")).toBe(shoesLabels.mileageUnset);
    expect(formatMileageInputValue("12.50")).toBe("12.5");
    expect(formatMileageInputValue(null)).toBe("");
  });

  it("formats notification state labels", () => {
    expect(formatNotifications(createShoe({ notifyOnLimitEmail: false }))).toBe(
      shoesLabels.notificationsOff
    );
    expect(formatNotifications(createShoe())).toBe(shoesLabels.emailNotification);
    expect(
      formatNotifications(
        createShoe({
          notifyOnLimitEmail: false,
          notifyOnLimitTelegram: true,
        })
      )
    ).toBe(shoesLabels.telegramNotification);
    expect(formatNotifications(createShoe({ notifyOnLimitTelegram: true }))).toBe(
      `${shoesLabels.emailNotification}, ${shoesLabels.telegramNotification}`
    );
  });

  it("formats pair count labels", () => {
    expect(getPairCountLabel(1)).toBe("пара");
    expect(getPairCountLabel(2)).toBe("пары");
    expect(getPairCountLabel(5)).toBe("пар");
    expect(getPairCountLabel(11)).toBe("пар");
    expect(getPairCountLabel(21)).toBe("пара");
  });

  it("builds mileage progress for configured and unconfigured limits", () => {
    expect(getShoeMileageProgress(createShoe())).toEqual({
      currentKm: 125.25,
      limitKm: 800.5,
      percentage: (125.25 / 800.5) * 100,
      remainingKm: 675.25,
      limitReached: false,
    });
    expect(
      getShoeMileageProgress(
        createShoe({
          currentMileageKm: "850",
          mileageLimitKm: "800",
        })
      )
    ).toEqual({
      currentKm: 850,
      limitKm: 800,
      percentage: 100,
      remainingKm: 0,
      limitReached: true,
    });
    expect(getShoeMileageProgress(createShoe({ mileageLimitKm: null }))).toEqual({
      currentKm: 125.25,
      limitKm: null,
      percentage: null,
      remainingKm: null,
      limitReached: false,
    });
    expect(
      getShoeMileageProgress(
        createShoe({
          currentMileageKm: "800",
          mileageLimitKm: "800",
        })
      )
    ).toEqual({
      currentKm: 800,
      limitKm: 800,
      percentage: 100,
      remainingKm: 0,
      limitReached: true,
    });
    expect(
      getShoeMileageProgress(
        createShoe({
          currentMileageKm: "0",
          mileageLimitKm: "0",
        })
      )
    ).toEqual({
      currentKm: 0,
      limitKm: 0,
      percentage: 100,
      remainingKm: 0,
      limitReached: true,
    });
  });

  it("creates form state from defaults and existing shoe", () => {
    expect(createEmptyForm()).toEqual({
      name: "",
      mileageLimitKm: "",
      notifyOnLimitEmail: false,
      notifyOnLimitTelegram: false,
    });

    expect(createFormFromShoe(createShoe())).toEqual({
      name: "Daily Trainer",
      mileageLimitKm: "800.5",
      notifyOnLimitEmail: true,
      notifyOnLimitTelegram: false,
    });
  });

  it("extracts shoes from API responses defensively", () => {
    const shoe = createShoe();

    expect(getShoesFromResponse({ shoes: [shoe] })).toEqual([shoe]);
    expect(getShoesFromResponse({ shoes: "invalid" })).toEqual([]);
    expect(getShoeFromResponse({ shoe })).toEqual(shoe);
    expect(getShoeFromResponse({ shoe: null })).toBeNull();
    expect(getShoeFromResponse(null)).toBeNull();
  });
});
