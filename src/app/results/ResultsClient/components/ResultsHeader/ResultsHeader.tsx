"use client";

import { RESULTS_LABELS } from "../../constants/resultsConstants";
import styles from "./ResultsHeader.module.scss";

export function ResultsHeader() {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{RESULTS_LABELS.title}</h1>
      <p className={styles.subtitle}>{RESULTS_LABELS.subtitle}</p>
    </header>
  );
}
