import { CheckOutlined, FileExcelOutlined } from "@ant-design/icons";
import { PLAN_TEXT } from "../../constants/planText";
import styles from "./PlanImportGuide.module.scss";

export function PlanImportGuide() {
  return (
    <aside className={styles.guide} aria-labelledby="plan-import-guide-title">
      <header className={styles.header}>
        <span className={styles.eyebrow}>{PLAN_TEXT.importPage.guide.eyebrow}</span>
        <div className={styles.titleRow}>
          <span className={styles.titleIcon} aria-hidden>
            <FileExcelOutlined />
          </span>
          <div>
            <h2 id="plan-import-guide-title" className={styles.title}>
              {PLAN_TEXT.importPage.guide.title}
            </h2>
            <p className={styles.description}>{PLAN_TEXT.importPage.guide.description}</p>
          </div>
        </div>
      </header>

      <div
        className={styles.schemaFrame}
        role="region"
        aria-label="Пример структуры первого листа Excel"
        aria-describedby="plan-import-schema-hint"
        tabIndex={0}
      >
        <table className={styles.schema} aria-label="Структура первого листа Excel">
          <thead>
            <tr>
              {PLAN_TEXT.importPage.guide.columns.map((column) => (
                <th key={column.key} scope="col">
                  <span>{column.label}</span>
                  <small>{column.requirement}</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {PLAN_TEXT.importPage.guide.columns.map((column) => (
                <td key={column.key}>{column.example}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p id="plan-import-schema-hint" className={styles.schemaHint}>
        {PLAN_TEXT.importPage.guide.schemaHint}
      </p>

      <section className={styles.notes} aria-labelledby="plan-import-notes-title">
        <h3 id="plan-import-notes-title" className={styles.notesTitle}>
          {PLAN_TEXT.importPage.guide.notesTitle}
        </h3>
        <ul className={styles.notesList}>
          {PLAN_TEXT.importPage.guide.notes.map((note) => (
            <li key={note}>
              <CheckOutlined aria-hidden />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
