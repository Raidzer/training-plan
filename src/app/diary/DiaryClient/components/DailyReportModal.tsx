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
  const handleCopyReport = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(reportText);
        return;
      } catch (error) {
        console.error(error);
      }
    }

    const textarea = document.createElement("textarea");
    textarea.value = reportText;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand("copy");
    } finally {
      document.body.removeChild(textarea);
    }
  };

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onClose}
      footer={[
        <Button key="copy" type="primary" onClick={handleCopyReport}>
          Скопировать отчет
        </Button>,
        <Button key="close" onClick={onClose}>
          {closeLabel}
        </Button>,
      ]}
    >
      <Typography.Paragraph className={styles.reportText}>{reportText}</Typography.Paragraph>
    </Modal>
  );
}
