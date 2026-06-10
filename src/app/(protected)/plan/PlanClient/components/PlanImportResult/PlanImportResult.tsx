import { Alert, Card, Space, Typography } from "antd";
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
  issues: PlanImportIssue[] | undefined;
  type: "danger" | "warning";
};

function TextList({ title, items }: { title: string; items: string[] | undefined }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div>
      <Typography.Text strong>{title}</Typography.Text>
      <ul className={styles.itemList}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function IssueList({ title, issues, type }: IssueListProps) {
  if (!issues || issues.length === 0) {
    return null;
  }

  return (
    <div>
      <Typography.Text type={type}>{title}</Typography.Text>
      <ul className={styles.itemList}>
        {issues.map((issue) => (
          <li key={`${issue.row}-${issue.message}`}>
            {PLAN_TEXT.importPage.rowError(issue.row, issue.message)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PlanImportResult({ result }: PlanImportResultProps) {
  const hasFailed = Boolean(result.error);

  return (
    <Card type="inner" title={PLAN_TEXT.importPage.resultTitle}>
      <Space orientation="vertical" size="small" className={styles.resultStack}>
        {hasFailed ? (
          <Alert
            type="error"
            showIcon
            title={PLAN_TEXT.importPage.failedTitle}
            description={result.error}
          />
        ) : (
          <Typography.Paragraph className={styles.resultParagraph}>
            {PLAN_TEXT.importPage.resultSummary(
              result.importId ?? 0,
              result.inserted ?? 0,
              result.skipped ?? 0
            )}
          </Typography.Paragraph>
        )}
        <TextList title={PLAN_TEXT.importPage.detailsTitle} items={result.details} />
        <TextList title={PLAN_TEXT.importPage.headersTitle} items={result.foundHeaders} />
        <IssueList title={PLAN_TEXT.importPage.rowErrors} issues={result.errors} type="danger" />
        <IssueList
          title={PLAN_TEXT.importPage.rowWarnings}
          issues={result.warnings}
          type="warning"
        />
      </Space>
    </Card>
  );
}
