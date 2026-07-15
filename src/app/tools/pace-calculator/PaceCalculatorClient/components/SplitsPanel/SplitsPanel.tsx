import { PACE_CALCULATOR_TEXT } from "../../constants/paceCalculatorConstants";
import type { SplitItem } from "../../types/paceCalculatorTypes";
import styles from "./SplitsPanel.module.scss";

type SplitsPanelProps = {
  splits: SplitItem[];
};

export function SplitsPanel({ splits }: SplitsPanelProps) {
  return (
    <section className={styles.panel} aria-labelledby="pace-splits-title">
      <div className={styles.sectionHeaderRow}>
        <p className={styles.sectionIndex}>Отсечки</p>
        <h2 className={styles.sectionTitle} id="pace-splits-title">
          {PACE_CALCULATOR_TEXT.splits.title}
        </h2>
      </div>
      <p className={styles.sectionHint}>{PACE_CALCULATOR_TEXT.splits.hint}</p>

      {splits.length > 0 ? (
        <ol className={styles.splitList} aria-label="Накопленное время по отметкам" role="list">
          {splits.map((item, index) => (
            <li className={styles.splitItem} key={item.label}>
              <span className={styles.splitNumber}>{String(index + 1).padStart(2, "0")}</span>
              <span className={styles.splitLabel}>{item.label}</span>
              <strong className={styles.splitTime}>{item.time}</strong>
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.emptyState}>{PACE_CALCULATOR_TEXT.splits.empty}</p>
      )}
    </section>
  );
}
