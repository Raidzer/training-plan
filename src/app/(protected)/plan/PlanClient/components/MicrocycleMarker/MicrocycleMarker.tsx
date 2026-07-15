import styles from "./MicrocycleMarker.module.scss";

const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;

type MicrocycleMarkerProps = {
  activeDayIndex: number;
  isToday: boolean;
  isWorkload: boolean;
};

export function MicrocycleMarker({ activeDayIndex, isToday, isWorkload }: MicrocycleMarkerProps) {
  const activeLabel = WEEKDAY_LABELS[activeDayIndex] ?? WEEKDAY_LABELS[0];
  const markerLabel =
    "День микроцикла: " +
    activeLabel +
    (isWorkload ? ", нагрузка" : "") +
    (isToday ? ", сегодня" : "");

  return (
    <ol className={styles.marker} aria-label={markerLabel}>
      {WEEKDAY_LABELS.map((label, index) => {
        const isActive = index === activeDayIndex;
        const className = [
          styles.segment,
          isActive ? styles.active : "",
          isActive && isWorkload ? styles.workload : "",
          isActive && isToday ? styles.today : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <li key={label} className={className} aria-hidden={!isActive}>
            {label}
          </li>
        );
      })}
    </ol>
  );
}
