import { Checkbox, Tooltip } from "antd";
import { shoesLabels } from "../../constants/shoesConstants";
import type {
  ShoeFormState,
  ShoeFormUpdate,
  ShoeNotificationAvailability,
} from "../../types/shoesTypes";
import styles from "./ShoeNotificationOptions.module.scss";

type ShoeNotificationOptionsProps = {
  form: ShoeFormState;
  disabled: boolean;
  notificationAvailability: ShoeNotificationAvailability;
  onChange: ShoeFormUpdate;
};

const getCheckedValue = (checked: boolean, ready: boolean, available: boolean) => {
  if (!ready) {
    return checked;
  }

  return available && checked;
};

const getTooltipTitle = (ready: boolean, available: boolean, unavailableText: string) => {
  if (!ready) {
    return shoesLabels.notificationAvailabilityLoading;
  }

  if (!available) {
    return unavailableText;
  }

  return undefined;
};

export function ShoeNotificationOptions({
  form,
  disabled,
  notificationAvailability,
  onChange,
}: ShoeNotificationOptionsProps) {
  const emailDisabled =
    disabled || !notificationAvailability.emailReady || !notificationAvailability.emailAvailable;
  const telegramDisabled =
    disabled ||
    !notificationAvailability.telegramReady ||
    !notificationAvailability.telegramAvailable;

  return (
    <div className={styles.settingsRow}>
      <Tooltip
        title={getTooltipTitle(
          notificationAvailability.emailReady,
          notificationAvailability.emailAvailable,
          shoesLabels.emailNotificationUnavailable
        )}
      >
        <span className={styles.checkboxWrapper}>
          <Checkbox
            checked={getCheckedValue(
              form.notifyOnLimitEmail,
              notificationAvailability.emailReady,
              notificationAvailability.emailAvailable
            )}
            disabled={emailDisabled}
            onChange={(event) => {
              onChange("notifyOnLimitEmail", event.target.checked);
            }}
          >
            {shoesLabels.emailNotification}
          </Checkbox>
        </span>
      </Tooltip>
      <Tooltip
        title={getTooltipTitle(
          notificationAvailability.telegramReady,
          notificationAvailability.telegramAvailable,
          shoesLabels.telegramNotificationUnavailable
        )}
      >
        <span className={styles.checkboxWrapper}>
          <Checkbox
            checked={getCheckedValue(
              form.notifyOnLimitTelegram,
              notificationAvailability.telegramReady,
              notificationAvailability.telegramAvailable
            )}
            disabled={telegramDisabled}
            onChange={(event) => {
              onChange("notifyOnLimitTelegram", event.target.checked);
            }}
          >
            {shoesLabels.telegramNotification}
          </Checkbox>
        </span>
      </Tooltip>
    </div>
  );
}
