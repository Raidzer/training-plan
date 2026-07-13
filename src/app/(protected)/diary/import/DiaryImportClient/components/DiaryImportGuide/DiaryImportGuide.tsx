import { CheckOutlined, FileExcelOutlined } from "@ant-design/icons";
import { DIARY_IMPORT_TEXT } from "../../constants/diaryImportConstants";
import styles from "./DiaryImportGuide.module.scss";

export function DiaryImportGuide() {
  return (
    <aside className={styles.guide} aria-labelledby="diary-import-guide-title">
      <header className={styles.header}>
        <span className={styles.eyebrow}>{DIARY_IMPORT_TEXT.guide.eyebrow}</span>
        <div className={styles.titleRow}>
          <span className={styles.titleIcon} aria-hidden>
            <FileExcelOutlined />
          </span>
          <div>
            <h2 id="diary-import-guide-title" className={styles.title}>
              {DIARY_IMPORT_TEXT.guide.title}
            </h2>
            <p className={styles.description}>{DIARY_IMPORT_TEXT.guide.description}</p>
          </div>
        </div>
      </header>

      <section className={styles.matchSection} aria-labelledby="diary-import-match-title">
        <h3 id="diary-import-match-title" className={styles.sectionTitle}>
          {DIARY_IMPORT_TEXT.guide.matchTitle}
        </h3>
        <ol className={styles.matchSteps} role="list">
          {DIARY_IMPORT_TEXT.guide.matchSteps.map((step, index) => (
            <li key={step.key}>
              <span className={styles.stepIndex}>{String(index + 1).padStart(2, "0")}</span>
              <div className={styles.stepCopy}>
                <span className={styles.stepLabel}>{step.label}</span>
                <strong>{step.value}</strong>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.dataSection} aria-labelledby="diary-import-data-title">
        <h3 id="diary-import-data-title" className={styles.sectionTitle}>
          {DIARY_IMPORT_TEXT.guide.dataTitle}
        </h3>
        <dl className={styles.dataGroups}>
          {DIARY_IMPORT_TEXT.guide.dataGroups.map((group) => (
            <div key={group.key}>
              <dt>{group.title}</dt>
              <dd>{group.items.join(" · ")}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.notes} aria-labelledby="diary-import-notes-title">
        <h3 id="diary-import-notes-title" className={styles.sectionTitle}>
          {DIARY_IMPORT_TEXT.guide.notesTitle}
        </h3>
        <ul className={styles.notesList} role="list">
          {DIARY_IMPORT_TEXT.guide.notes.map((note) => (
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
