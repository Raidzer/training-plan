import { Card, List, Typography } from "antd";
import { PLAN_TEXT } from "../../constants/planText";
import type { PlanImportResult as PlanImportResultData } from "../../types/planTypes";
import styles from "./PlanImportResult.module.scss";

type PlanImportResultProps = {
  result: PlanImportResultData;
};

export function PlanImportResult({ result }: PlanImportResultProps) {
  return (
    <Card type="inner" title={PLAN_TEXT.importPage.resultTitle}>
      <Typography.Paragraph className={styles.resultParagraph}>
        {PLAN_TEXT.importPage.resultSummary(result.importId, result.inserted, result.skipped)}
      </Typography.Paragraph>
      {result.errors && result.errors.length > 0 ? (
        <>
          <Typography.Text type="danger">{PLAN_TEXT.importPage.rowErrors}</Typography.Text>
          <List
            size="small"
            dataSource={result.errors}
            renderItem={(error) => (
              <List.Item>{PLAN_TEXT.importPage.rowError(error.row, error.message)}</List.Item>
            )}
            className={styles.errorList}
          />
        </>
      ) : null}
    </Card>
  );
}
