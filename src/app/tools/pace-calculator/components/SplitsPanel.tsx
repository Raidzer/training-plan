import styles from "../pace-calculator.module.scss";
import type { SplitItem } from "../pace-calculator.types";

type SplitsPanelProps = {
  splits: SplitItem[];
  splitGroups: SplitItem[][];
};

export function SplitsPanel({ splits, splitGroups }: SplitsPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.sectionHeaderRow}>
        <h2 className={styles.sectionTitle}>
          Раскладка на дистанции (километры)
        </h2>
      </div>
      <p className={styles.sectionHint}>
        Мы посчитали, через сколько вы будете пробегать каждый километр, если
        бежать с таким темпом:
      </p>
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
        <p className={styles.emptyState}>
          Введите дистанцию и темп, чтобы увидеть раскладку.
        </p>
      )}
    </div>
  );
}
