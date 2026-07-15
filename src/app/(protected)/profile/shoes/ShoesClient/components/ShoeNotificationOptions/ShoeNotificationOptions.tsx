import { Checkbox } from "antd";
import { shoesLabels } from "../../constants/shoesConstants";
import type {
  ShoeFormState,
  ShoeFormUpdate,
  ShoeNotificationAvailability,
} from "../../types/shoesTypes";
import styles from "./ShoeNotificationOptions.module.scss";

type ShoeNotificationOptionsProps = {
  idPrefix?: string;
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

const getAvailabilityLabel = (ready: boolean, available: boolean) => {
  if (!ready) {
    return shoesLabels.notificationChecking;
  }

  if (!available) {
    return shoesLabels.notificationUnavailable;
  }

  return shoesLabels.notificationAvailable;
};

export function ShoeNotificationOptions({
  idPrefix = "shoe",
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
  const emailDescriptionId = `${idPrefix}-email-description`;
  const telegramDescriptionId = `${idPrefix}-telegram-description`;
  const emailHasDescription =
    !notificationAvailability.emailReady || !notificationAvailability.emailAvailable;
  const telegramHasDescription =
    !notificationAvailability.telegramReady || !notificationAvailability.telegramAvailable;

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{shoesLabels.notificationsLegend}</legend>
      <p className={styles.hint}>{shoesLabels.notificationsHint}</p>

      <div className={styles.channels}>
        <div className={styles.channel}>
          <div className={styles.channelControl}>
            <Checkbox
              id={`${idPrefix}-email`}
              name="notifyOnLimitEmail"
              checked={getCheckedValue(
                form.notifyOnLimitEmail,
                notificationAvailability.emailReady,
                notificationAvailability.emailAvailable
              )}
              disabled={emailDisabled}
              aria-describedby={emailHasDescription ? emailDescriptionId : undefined}
              onChange={(event) => {
                onChange("notifyOnLimitEmail", event.target.checked);
              }}
            >
              {shoesLabels.emailNotification}
            </Checkbox>
            <span className={styles.status} aria-live="polite">
              {getAvailabilityLabel(
                notificationAvailability.emailReady,
                notificationAvailability.emailAvailable
              )}
            </span>
          </div>
          {emailHasDescription ? (
            <span id={emailDescriptionId} className={styles.channelDescription}>
              {notificationAvailability.emailReady
                ? shoesLabels.emailNotificationUnavailable
                : shoesLabels.notificationAvailabilityLoading}
            </span>
          ) : null}
        </div>

        <div className={styles.channel}>
          <div className={styles.channelControl}>
            <Checkbox
              id={`${idPrefix}-telegram`}
              name="notifyOnLimitTelegram"
              checked={getCheckedValue(
                form.notifyOnLimitTelegram,
                notificationAvailability.telegramReady,
                notificationAvailability.telegramAvailable
              )}
              disabled={telegramDisabled}
              aria-describedby={telegramHasDescription ? telegramDescriptionId : undefined}
              onChange={(event) => {
                onChange("notifyOnLimitTelegram", event.target.checked);
              }}
            >
              {shoesLabels.telegramNotification}
            </Checkbox>
            <span className={styles.status} aria-live="polite">
              {getAvailabilityLabel(
                notificationAvailability.telegramReady,
                notificationAvailability.telegramAvailable
              )}
            </span>
          </div>
          {telegramHasDescription ? (
            <span id={telegramDescriptionId} className={styles.channelDescription}>
              {notificationAvailability.telegramReady
                ? shoesLabels.telegramNotificationUnavailable
                : shoesLabels.notificationAvailabilityLoading}
            </span>
          ) : null}
        </div>
      </div>
    </fieldset>
  );
}
