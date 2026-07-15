import { RESULT_EQUIVALENT_TEXT } from "../../constants/resultEquivalentConstants";
import type { EquivalentResult } from "../../types/resultEquivalentTypes";
import styles from "./EquivalentTable.module.scss";

type EquivalentTableProps = {
  equivalents: EquivalentResult[];
};

export function EquivalentTable({ equivalents }: EquivalentTableProps) {
  return (
    <section className={styles.panel} aria-labelledby="equivalent-table-title">
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.panelIndex}>Сравнение</p>
          <h2 className={styles.sectionTitle} id="equivalent-table-title">
            {RESULT_EQUIVALENT_TEXT.table.title}
          </h2>
        </div>
        <span
          className={styles.resultsCount}
          aria-label={`Рассчитано дистанций: ${equivalents.length}`}
        >
          {String(equivalents.length).padStart(2, "0")}
        </span>
      </div>
      <p className={styles.sectionHint}>{RESULT_EQUIVALENT_TEXT.table.hint}</p>

      {equivalents.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption>{RESULT_EQUIVALENT_TEXT.table.hint}</caption>
            <colgroup>
              <col className={styles.distanceColumn} />
              <col />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">{RESULT_EQUIVALENT_TEXT.table.distanceColumn}</th>
                <th scope="col">{RESULT_EQUIVALENT_TEXT.table.resultColumn}</th>
                <th scope="col">{RESULT_EQUIVALENT_TEXT.table.paceColumn}</th>
              </tr>
            </thead>
            <tbody>
              {equivalents.map((item) => (
                <tr
                  className={item.isSourceDistance ? styles.sourceRow : undefined}
                  key={item.distanceMeters}
                >
                  <th scope="row">
                    <span className={styles.distanceCell}>
                      <span>{item.distanceLabel}</span>
                      {item.isSourceDistance ? (
                        <span className={styles.sourceBadge}>
                          {RESULT_EQUIVALENT_TEXT.table.sameDistance}
                        </span>
                      ) : null}
                    </span>
                  </th>
                  <td className={styles.numericCell}>{item.resultTime}</td>
                  <td className={styles.numericCell}>{item.paceTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.emptyState}>{RESULT_EQUIVALENT_TEXT.table.empty}</p>
      )}
    </section>
  );
}
