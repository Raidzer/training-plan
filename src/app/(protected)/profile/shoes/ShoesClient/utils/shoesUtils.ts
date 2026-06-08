import { MAX_MILEAGE_KM, MAX_NAME_LENGTH, shoesLabels } from "../constants/shoesConstants";
import type {
  MileageValidation,
  NameValidation,
  ShoeFormState,
  ShoeItem,
} from "../types/shoesTypes";

export const validateName = (value: string): NameValidation => {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, error: shoesLabels.nameRequired };
  }
  if (trimmed.length > MAX_NAME_LENGTH) {
    return { ok: false, error: shoesLabels.nameTooLong };
  }
  return { ok: true, value: trimmed };
};

export const validateMileageLimit = (
  value: string,
  emptyValue: null | undefined
): MileageValidation => {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: true, value: emptyValue };
  }

  const parsed = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > MAX_MILEAGE_KM) {
    return { ok: false, error: shoesLabels.mileageInvalid };
  }

  return { ok: true, value: Math.round(parsed * 100) / 100 };
};

export const formatMileageValue = (value: string | null) => {
  if (!value) {
    return shoesLabels.mileageUnset;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return shoesLabels.mileageUnset;
  }

  return `${new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 2,
  }).format(parsed)} км`;
};

export const formatMileageInputValue = (value: string | null) => {
  if (!value) {
    return "";
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : "";
};

export const formatNotifications = (item: ShoeItem) => {
  const channels: string[] = [];
  if (item.notifyOnLimitEmail) {
    channels.push(shoesLabels.emailNotification);
  }
  if (item.notifyOnLimitTelegram) {
    channels.push(shoesLabels.telegramNotification);
  }
  return channels.length > 0 ? channels.join(", ") : shoesLabels.notificationsOff;
};

export const createEmptyForm = (): ShoeFormState => ({
  name: "",
  mileageLimitKm: "",
  notifyOnLimitEmail: false,
  notifyOnLimitTelegram: false,
});

export const createFormFromShoe = (item: ShoeItem): ShoeFormState => ({
  name: item.name,
  mileageLimitKm: formatMileageInputValue(item.mileageLimitKm),
  notifyOnLimitEmail: item.notifyOnLimitEmail,
  notifyOnLimitTelegram: item.notifyOnLimitTelegram,
});

export const getShoesFromResponse = (data: unknown): ShoeItem[] => {
  if (!data || typeof data !== "object") {
    return [];
  }
  const shoesValue = (data as { shoes?: unknown }).shoes;
  if (!Array.isArray(shoesValue)) {
    return [];
  }
  return shoesValue as ShoeItem[];
};

export const getShoeFromResponse = (data: unknown): ShoeItem | null => {
  if (!data || typeof data !== "object") {
    return null;
  }
  const shoeValue = (data as { shoe?: unknown }).shoe;
  if (!shoeValue || typeof shoeValue !== "object") {
    return null;
  }
  return shoeValue as ShoeItem;
};
