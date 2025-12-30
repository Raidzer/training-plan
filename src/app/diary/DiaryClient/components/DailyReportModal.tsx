"use client";

import { Button, Modal, Typography } from "antd";
import styles from "../diary.module.scss";

type DailyReportModalProps = {
  open: boolean;
  title: string;
  closeLabel: string;
  reportText: string;
  onClose: () => void;
};

export function DailyReportModal({
  open,
  title,
  closeLabel,
  reportText,
  onClose,
}: DailyReportModalProps) {
  return (
    <Modal
      open={open}
      title={title}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          {closeLabel}
        </Button>,
      ]}
    >
      <Typography.Paragraph className={styles.reportText}>
        {reportText}
      </Typography.Paragraph>
    </Modal>
  );
}
