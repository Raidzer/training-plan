import { RESULT_EQUIVALENT_TEXT } from "../../constants/resultEquivalentConstants";
import type { EquivalentResult } from "../../types/resultEquivalentTypes";
import styles from "./EquivalentTable.module.scss";

type EquivalentTableProps = {
  equivalents: EquivalentResult[];
};

export function EquivalentTable({ equivalents }: EquivalentTableProps) {
  return (
    <div className={styles.panel}>
      <h2 className={styles.sectionTitle}>{RESULT_EQUIVALENT_TEXT.table.title}</h2>
      <p className={styles.sectionHint}>{RESULT_EQUIVALENT_TEXT.table.hint}</p>

      {equivalents.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{RESULT_EQUIVALENT_TEXT.table.distanceColumn}</th>
                <th>{RESULT_EQUIVALENT_TEXT.table.resultColumn}</th>
                <th>{RESULT_EQUIVALENT_TEXT.table.paceColumn}</th>
              </tr>
            </thead>
            <tbody>
              {equivalents.map((item) => (
                <tr
                  className={item.isSourceDistance ? styles.sourceRow : undefined}
                  key={item.distanceMeters}
                >
                  <td>
                    <div className={styles.distanceCell}>
                      <span>{item.distanceLabel}</span>
                      {item.isSourceDistance ? (
                        <span className={styles.sourceBadge}>
                          {RESULT_EQUIVALENT_TEXT.table.sameDistance}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td>{item.resultTime}</td>
                  <td>{item.paceTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.emptyState}>{RESULT_EQUIVALENT_TEXT.table.empty}</p>
      )}
    </div>
  );
}
