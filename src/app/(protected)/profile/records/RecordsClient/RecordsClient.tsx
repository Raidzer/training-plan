"use client";

import { App, Button, Card, Typography } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { RecordsGrid } from "./components/RecordsGrid/RecordsGrid";
import { RECORDS_LABELS } from "./constants/recordsConstants";
import { useRecords } from "./hooks/useRecords";
import type { RecordsClientProps } from "./types/recordsTypes";
import styles from "./RecordsClient.module.scss";

export function RecordsClient({ apiUrl = "/api/personal-records" }: RecordsClientProps) {
  const { message: messageApi } = App.useApp();
  const { rows, loading, saving, errors, handleFieldChange, handleSave } = useRecords({
    apiUrl,
    messageApi,
  });

  return (
    <main className={styles.page}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Typography.Title level={3} className={styles.title}>
            {RECORDS_LABELS.title}
          </Typography.Title>
          <Typography.Paragraph type="secondary" className={styles.subtitle}>
            {RECORDS_LABELS.subtitle}
          </Typography.Paragraph>
        </div>

        <div className={styles.helpBox}>
          <div className={styles.helpIcon}>
            <InfoCircleOutlined />
          </div>
          <div className={styles.helpContent}>
            <Typography.Text strong className={styles.helpTitle}>
              {RECORDS_LABELS.alertTitle}
            </Typography.Text>
            <Typography.Paragraph className={styles.helpText}>
              {RECORDS_LABELS.alertText}
            </Typography.Paragraph>
          </div>
        </div>

        <RecordsGrid
          rows={rows}
          loading={loading}
          saving={saving}
          errors={errors}
          onFieldChange={handleFieldChange}
        />

        <div className={styles.actions}>
          <Button type="primary" onClick={handleSave} loading={saving} disabled={loading || saving}>
            {RECORDS_LABELS.saveButton}
          </Button>
        </div>
      </Card>
    </main>
  );
}
