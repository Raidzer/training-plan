import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { DIARY_IMPORT_TEXT } from "../../constants/diaryImportConstants";
import type {
  DiaryImportIssue,
  DiaryImportResult as DiaryImportResultData,
} from "../../types/diaryImportTypes";
import styles from "./DiaryImportResult.module.scss";

type DiaryImportResultProps = {
  result: DiaryImportResultData;
};

type IssueListProps = {
  title: string;
  issues: DiaryImportIssue[];
  kind: "error" | "warning";
};

function IssueList({ title, issues, kind }: IssueListProps) {
  if (issues.length === 0) {
    return null;
  }

  const IssueIcon = kind === "error" ? CloseCircleOutlined : WarningOutlined;

  return (
    <section className={styles.issueGroup}>
      <header className={styles.issueHeader}>
        <div className={styles.issueHeading}>
          <IssueIcon aria-hidden />
          <h3>{title}</h3>
        </div>
        <span className={styles.issueCount}>{issues.length}</span>
      </header>
      <ul className={styles.issueList} aria-label={`${title}: ${issues.length}`} tabIndex={0}>
        {issues.map((issue, index) => (
          <li key={`${issue.row}-${issue.message}-${index}`}>
            {DIARY_IMPORT_TEXT.result.issue(issue.row, issue.message)}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DiaryImportResult({ result }: DiaryImportResultProps) {
  const errors = result.errors ?? [];
  const warnings = result.warnings ?? [];
  const hasFailed = Boolean(result.error);
  const hasIssues = errors.length + warnings.length > 0;
  const isEmpty = !hasFailed && !hasIssues && (result.parsedRows ?? 0) === 0;

  let resultTitle: string = DIARY_IMPORT_TEXT.result.successTitle;
  let resultDescription: string = DIARY_IMPORT_TEXT.result.successDescription;
  let ResultIcon = CheckCircleOutlined;

  if (hasIssues) {
    resultTitle = DIARY_IMPORT_TEXT.result.issuesTitle;
    resultDescription = DIARY_IMPORT_TEXT.result.issuesDescription;
    ResultIcon = WarningOutlined;
  }

  if (isEmpty) {
    resultTitle = DIARY_IMPORT_TEXT.result.emptyTitle;
    resultDescription = DIARY_IMPORT_TEXT.result.emptyDescription;
    ResultIcon = WarningOutlined;
  }

  if (hasFailed) {
    resultTitle = DIARY_IMPORT_TEXT.result.failedTitle;
    resultDescription = DIARY_IMPORT_TEXT.result.failedDescription;
    ResultIcon = CloseCircleOutlined;
  }

  return (
    <section className={styles.result} aria-labelledby="diary-import-result-title">
      <header className={styles.resultHeader}>
        <span className={styles.statusIcon} aria-hidden>
          <ResultIcon />
        </span>
        <div className={styles.resultCopy}>
          <span className={styles.eyebrow}>{DIARY_IMPORT_TEXT.result.eyebrow}</span>
          <h2 id="diary-import-result-title" className={styles.resultTitle}>
            {resultTitle}
          </h2>
          <p className={styles.resultDescription}>{resultDescription}</p>
        </div>
      </header>

      {hasFailed ? (
        <div className={styles.failureMessage} role="alert">
          {result.error}
        </div>
      ) : (
        <>
          <dl className={styles.primaryMetrics}>
            <div className={styles.primaryMetric}>
              <dt>{DIARY_IMPORT_TEXT.result.parsedRows}</dt>
              <dd>{result.parsedRows ?? 0}</dd>
            </div>
            <div className={styles.primaryMetric}>
              <dt>{DIARY_IMPORT_TEXT.result.matchedRows}</dt>
              <dd>{result.matchedRows ?? 0}</dd>
            </div>
            <div className={styles.primaryMetric}>
              <dt>{DIARY_IMPORT_TEXT.result.reportsUpserted}</dt>
              <dd>{result.reportsUpserted ?? 0}</dd>
            </div>
            <div className={styles.primaryMetric}>
              <dt>{DIARY_IMPORT_TEXT.result.skippedRows}</dt>
              <dd>{result.skippedRows ?? 0}</dd>
            </div>
          </dl>

          <section className={styles.details} aria-labelledby="diary-import-details-title">
            <h3 id="diary-import-details-title" className={styles.detailsTitle}>
              {DIARY_IMPORT_TEXT.result.detailsTitle}
            </h3>
            <dl className={styles.secondaryMetrics}>
              <div>
                <dt>{DIARY_IMPORT_TEXT.result.reportsSkipped}</dt>
                <dd>{result.reportsSkipped ?? 0}</dd>
              </div>
              <div>
                <dt>{DIARY_IMPORT_TEXT.result.weightEntriesUpserted}</dt>
                <dd>{result.weightEntriesUpserted ?? 0}</dd>
              </div>
              <div>
                <dt>{DIARY_IMPORT_TEXT.result.recoveryEntriesUpserted}</dt>
                <dd>{result.recoveryEntriesUpserted ?? 0}</dd>
              </div>
            </dl>
          </section>
        </>
      )}

      {result.sheetName ? (
        <p className={styles.sheetMeta}>
          <span>{DIARY_IMPORT_TEXT.result.sheet}</span>
          <strong>{result.sheetName}</strong>
        </p>
      ) : null}

      {hasIssues ? (
        <div className={styles.issuesGrid}>
          <IssueList title={DIARY_IMPORT_TEXT.result.errorsTitle} issues={errors} kind="error" />
          <IssueList
            title={DIARY_IMPORT_TEXT.result.warningsTitle}
            issues={warnings}
            kind="warning"
          />
        </div>
      ) : null}

      {hasFailed || isEmpty ? null : (
        <footer className={styles.resultFooter}>
          <Link href="/plan" className={styles.secondaryLink}>
            {DIARY_IMPORT_TEXT.result.openPlan}
          </Link>
          <Link href="/diary/period" className={styles.primaryLink}>
            <span>{DIARY_IMPORT_TEXT.result.openDiary}</span>
            <ArrowRightOutlined aria-hidden />
          </Link>
        </footer>
      )}
    </section>
  );
}
