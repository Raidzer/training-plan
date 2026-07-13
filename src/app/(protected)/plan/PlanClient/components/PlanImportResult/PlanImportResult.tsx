import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { PLAN_TEXT } from "../../constants/planText";
import type {
  PlanImportIssue,
  PlanImportResult as PlanImportResultData,
} from "../../types/planTypes";
import styles from "./PlanImportResult.module.scss";

type PlanImportResultProps = {
  result: PlanImportResultData;
};

type IssueListProps = {
  title: string;
  issues: PlanImportIssue[];
  kind: "error" | "warning";
};

type TextListProps = {
  title: string;
  items: string[];
  compact?: boolean;
};

function TextList({ title, items, compact = false }: TextListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className={styles.detailGroup}>
      <h3 className={styles.groupTitle}>{title}</h3>
      <ul className={compact ? styles.headerList : styles.textList}>
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function IssueList({ title, issues, kind }: IssueListProps) {
  if (issues.length === 0) {
    return null;
  }

  const IssueIcon = kind === "error" ? CloseCircleOutlined : WarningOutlined;

  return (
    <section className={styles.issueGroup}>
      <header className={styles.groupHeader}>
        <div className={styles.groupHeading}>
          <IssueIcon aria-hidden />
          <h3 className={styles.groupTitle}>{title}</h3>
        </div>
        <span className={styles.issueCount}>{issues.length}</span>
      </header>
      <ul
        className={styles.issueList}
        aria-label={`${title}: ${issues.length}`}
        tabIndex={issues.length > 6 ? 0 : undefined}
      >
        {issues.map((issue, index) => (
          <li key={`${issue.row}-${issue.message}-${index}`}>
            {PLAN_TEXT.importPage.rowError(issue.row, issue.message)}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PlanImportResult({ result }: PlanImportResultProps) {
  const errors = result.errors ?? [];
  const warnings = result.warnings ?? [];
  const details = result.details ?? [];
  const foundHeaders = result.foundHeaders ?? [];
  const hasFailed = Boolean(result.error);
  const hasIssues = errors.length + warnings.length > 0;

  let resultTitle: string = PLAN_TEXT.importPage.result.successTitle;
  let resultDescription: string = PLAN_TEXT.importPage.result.successDescription;
  let ResultIcon = CheckCircleOutlined;

  if (hasIssues) {
    resultTitle = PLAN_TEXT.importPage.result.issuesTitle;
    resultDescription = PLAN_TEXT.importPage.result.issuesDescription;
    ResultIcon = WarningOutlined;
  }

  if (hasFailed) {
    resultTitle = PLAN_TEXT.importPage.result.failedTitle;
    resultDescription = PLAN_TEXT.importPage.result.failedDescription;
    ResultIcon = CloseCircleOutlined;
  }

  return (
    <section
      className={styles.result}
      aria-labelledby="plan-import-result-title"
      aria-live="polite"
    >
      <header className={styles.resultHeader}>
        <span className={styles.statusIcon} aria-hidden>
          <ResultIcon />
        </span>
        <div className={styles.resultCopy}>
          <span className={styles.eyebrow}>{PLAN_TEXT.importPage.result.eyebrow}</span>
          <h2 id="plan-import-result-title" className={styles.resultTitle}>
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
        <dl className={styles.metrics}>
          <div className={styles.metric}>
            <dt>{PLAN_TEXT.importPage.result.inserted}</dt>
            <dd>{result.inserted ?? 0}</dd>
          </div>
          <div className={styles.metric}>
            <dt>{PLAN_TEXT.importPage.result.skipped}</dt>
            <dd>{result.skipped ?? 0}</dd>
          </div>
          <div className={styles.metric}>
            <dt>{PLAN_TEXT.importPage.result.totalRows}</dt>
            <dd>{result.totalRows ?? "—"}</dd>
          </div>
          <div className={styles.metric}>
            <dt>{PLAN_TEXT.importPage.result.importId}</dt>
            <dd>{result.importId ? `#${result.importId}` : "—"}</dd>
          </div>
        </dl>
      )}

      {result.sheetName ? (
        <p className={styles.sheetMeta}>
          <span>{PLAN_TEXT.importPage.result.sheet}</span>
          <strong>{result.sheetName}</strong>
        </p>
      ) : null}

      <div className={styles.detailsGrid}>
        <TextList title={PLAN_TEXT.importPage.result.detailsTitle} items={details} />
        <TextList title={PLAN_TEXT.importPage.result.headersTitle} items={foundHeaders} compact />
        <IssueList title={PLAN_TEXT.importPage.result.rowErrors} issues={errors} kind="error" />
        <IssueList
          title={PLAN_TEXT.importPage.result.rowWarnings}
          issues={warnings}
          kind="warning"
        />
      </div>

      {hasFailed ? null : (
        <footer className={styles.resultFooter}>
          <Link href="/plan" className={styles.planLink}>
            <span>{PLAN_TEXT.importPage.result.openPlan}</span>
            <ArrowRightOutlined aria-hidden />
          </Link>
        </footer>
      )}
    </section>
  );
}
