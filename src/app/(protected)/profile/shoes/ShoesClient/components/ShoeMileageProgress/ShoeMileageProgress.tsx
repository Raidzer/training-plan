import { shoesLabels } from "../../constants/shoesConstants";
import type { ShoeItem } from "../../types/shoesTypes";
import { formatMileageValue, getShoeMileageProgress } from "../../utils/shoesUtils";
import styles from "./ShoeMileageProgress.module.scss";

type ShoeMileageProgressProps = {
  item: ShoeItem;
};

export function ShoeMileageProgress({ item }: ShoeMileageProgressProps) {
  const progress = getShoeMileageProgress(item);
  const currentMileage = formatMileageValue(String(progress.currentKm));
  const limitMileage = formatMileageValue(item.mileageLimitKm);
  const progressMax = progress.limitKm === null || progress.limitKm === 0 ? 1 : progress.limitKm;
  const progressValue =
    progress.limitKm === 0 ? 1 : Math.min(progress.currentKm, progress.limitKm ?? 0);

  let statusText: string = shoesLabels.mileageNotConfiguredLabel;
  if (progress.limitReached) {
    statusText = shoesLabels.mileageReachedLabel;
  } else if (progress.remainingKm !== null) {
    statusText = `${shoesLabels.mileageRemainingLabel}: ${formatMileageValue(
      String(progress.remainingKm)
    )}`;
  }

  return (
    <section className={styles.mileage} aria-label={shoesLabels.mileageSectionLabel}>
      <div className={styles.header}>
        <span className={styles.label}>{shoesLabels.currentMileageLabel}</span>
        <span className={styles.value}>
          {currentMileage}
          <span aria-hidden> / </span>
          <span className={styles.limit}>{limitMileage}</span>
        </span>
      </div>

      {progress.limitKm === null ? (
        <div className={styles.unconfiguredTrack} aria-hidden />
      ) : (
        <progress
          className={styles.progress}
          max={progressMax}
          value={progressValue}
          aria-label={`${item.name}: ${currentMileage} из ${limitMileage}`}
        />
      )}

      <p className={styles.status}>{statusText}</p>
    </section>
  );
}
