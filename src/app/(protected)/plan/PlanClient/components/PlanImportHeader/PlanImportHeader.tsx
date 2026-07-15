import { ArrowLeftOutlined } from "@ant-design/icons";
import Link from "next/link";
import { PLAN_TEXT } from "../../constants/planText";
import styles from "./PlanImportHeader.module.scss";

export function PlanImportHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>{PLAN_TEXT.importPage.eyebrow}</span>
        <h1 className={styles.title}>{PLAN_TEXT.importPage.title}</h1>
        <p className={styles.subtitle}>{PLAN_TEXT.importPage.description}</p>
      </div>

      <Link href="/plan" className={styles.backLink}>
        <ArrowLeftOutlined aria-hidden />
        <span>{PLAN_TEXT.actions.backToPlan}</span>
      </Link>
    </header>
  );
}
