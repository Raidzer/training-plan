export type ShoeItem = {
  id: number;
  name: string;
  mileageLimitKm: string | null;
  currentMileageKm: string | null;
  notifyOnLimitEmail: boolean;
  notifyOnLimitTelegram: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ShoeFormState = {
  name: string;
  mileageLimitKm: string;
  notifyOnLimitEmail: boolean;
  notifyOnLimitTelegram: boolean;
};

export type ShoeNotificationAvailability = {
  emailAvailable: boolean;
  emailReady: boolean;
  telegramAvailable: boolean;
  telegramReady: boolean;
};

export type ShoeFormUpdate = <Key extends keyof ShoeFormState>(
  key: Key,
  value: ShoeFormState[Key]
) => void;

export type NameValidation = { ok: true; value: string } | { ok: false; error: string };

export type MileageValidation =
  | { ok: true; value: number | null | undefined }
  | { ok: false; error: string };

export type ShoeMutationPayload = {
  name: string;
  mileageLimitKm?: number | null;
  notifyOnLimitEmail: boolean;
  notifyOnLimitTelegram: boolean;
};
