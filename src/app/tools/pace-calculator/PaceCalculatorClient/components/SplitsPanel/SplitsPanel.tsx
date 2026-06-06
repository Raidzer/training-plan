import { PACE_CALCULATOR_TEXT } from "../../constants/paceCalculatorConstants";
import type { SplitItem } from "../../types/paceCalculatorTypes";
import styles from "./SplitsPanel.module.scss";

type SplitsPanelProps = {
  splits: SplitItem[];
  splitGroups: SplitItem[][];
};

export function SplitsPanel({ splits, splitGroups }: SplitsPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.sectionHeaderRow}>
        <h2 className={styles.sectionTitle}>{PACE_CALCULATOR_TEXT.splits.title}</h2>
      </div>
      <p className={styles.sectionHint}>{PACE_CALCULATOR_TEXT.splits.hint}</p>
      {splits.length > 0 ? (
        <div className={styles.splitColumns}>
          {splitGroups.map((group, groupIndex) => (
            <ul className={styles.splitList} key={`group-${groupIndex}`}>
              {group.map((item) => (
                <li className={styles.splitItem} key={item.label}>
                  <span>{item.label}</span>
                  <span>{item.time}</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      ) : (
        <p className={styles.emptyState}>{PACE_CALCULATOR_TEXT.splits.empty}</p>
      )}
    </div>
  );
}
