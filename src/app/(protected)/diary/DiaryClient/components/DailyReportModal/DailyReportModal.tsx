"use client";

import { useState } from "react";
import { Button, Modal, Typography } from "antd";
import { CheckOutlined, CopyOutlined } from "@ant-design/icons";
import { REPORT_LABELS } from "../../constants/diaryConstants";
import styles from "./DailyReportModal.module.scss";

type DailyReportModalProps = {
  open: boolean;
  title: string;
  copyLabel?: string;
  copiedLabel?: string;
  closeLabel: string;
  reportText: string;
  onClose: () => void;
};

export function DailyReportModal({
  open,
  title,
  copyLabel = REPORT_LABELS.copyLabel,
  copiedLabel = REPORT_LABELS.copiedLabel,
  closeLabel,
  reportText,
  onClose,
}: DailyReportModalProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyReport = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(reportText);
        setIsCopied(true);
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
      setIsCopied(true);
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const handleClose = () => {
    setIsCopied(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      title={title}
      width="min(720px, calc(100vw - 24px))"
      className={styles.reportModal}
      onCancel={handleClose}
      destroyOnHidden
      footer={[
        <Button
          key="copy"
          type="primary"
          icon={isCopied ? <CheckOutlined aria-hidden /> : <CopyOutlined aria-hidden />}
          onClick={handleCopyReport}
        >
          {isCopied ? copiedLabel : copyLabel}
        </Button>,
        <Button key="close" onClick={handleClose}>
          {closeLabel}
        </Button>,
      ]}
    >
      <Typography.Paragraph className={styles.reportText}>{reportText}</Typography.Paragraph>
    </Modal>
  );
}
