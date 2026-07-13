import { Card, List, Space, Typography } from "antd";
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
  issues: DiaryImportIssue[] | undefined;
  type: "danger" | "warning";
};

function IssueList({ title, issues, type }: IssueListProps) {
  if (!issues || issues.length === 0) {
    return null;
  }

  return (
    <div className={styles.issueBlock}>
      <Typography.Text type={type}>{title}</Typography.Text>
      <List
        size="small"
        dataSource={issues}
        renderItem={(issue) => (
          <List.Item>{DIARY_IMPORT_TEXT.result.issue(issue.row, issue.message)}</List.Item>
        )}
        className={styles.issueList}
      />
    </div>
  );
}

export function DiaryImportResult({ result }: DiaryImportResultProps) {
  return (
    <Card type="inner" title={DIARY_IMPORT_TEXT.page.resultTitle}>
      <Space orientation="vertical" size="small" className={styles.resultStack}>
        <Typography.Paragraph className={styles.resultParagraph}>
          {DIARY_IMPORT_TEXT.result.summary({
            sheetName: result.sheetName,
            parsedRows: result.parsedRows,
            matchedRows: result.matchedRows,
            skippedRows: result.skippedRows,
          })}
        </Typography.Paragraph>
        <Space size="middle" wrap>
          <Typography.Text>
            {DIARY_IMPORT_TEXT.result.reports(result.reportsUpserted)}
          </Typography.Text>
          <Typography.Text>
            {DIARY_IMPORT_TEXT.result.skippedReports(result.reportsSkipped)}
          </Typography.Text>
          <Typography.Text>
            {DIARY_IMPORT_TEXT.result.weights(result.weightEntriesUpserted)}
          </Typography.Text>
          <Typography.Text>
            {DIARY_IMPORT_TEXT.result.recovery(result.recoveryEntriesUpserted)}
          </Typography.Text>
        </Space>
        <IssueList
          title={DIARY_IMPORT_TEXT.page.errorsTitle}
          issues={result.errors}
          type="danger"
        />
        <IssueList
          title={DIARY_IMPORT_TEXT.page.warningsTitle}
          issues={result.warnings}
          type="warning"
        />
      </Space>
    </Card>
  );
}
