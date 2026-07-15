import { ArrowLeftOutlined } from "@ant-design/icons";
import Link from "next/link";
import { DIARY_IMPORT_TEXT } from "../../constants/diaryImportConstants";
import styles from "./DiaryImportHeader.module.scss";

export function DiaryImportHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>{DIARY_IMPORT_TEXT.page.eyebrow}</span>
        <h1 className={styles.title}>{DIARY_IMPORT_TEXT.page.title}</h1>
        <p className={styles.subtitle}>{DIARY_IMPORT_TEXT.page.description}</p>
      </div>

      <Link href="/plan" className={styles.backLink}>
        <ArrowLeftOutlined aria-hidden />
        <span>{DIARY_IMPORT_TEXT.actions.backToPlan}</span>
      </Link>
    </header>
  );
}
