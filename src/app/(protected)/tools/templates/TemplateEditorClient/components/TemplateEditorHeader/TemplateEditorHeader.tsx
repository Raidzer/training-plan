"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";
import { TEMPLATE_EDITOR_LABELS } from "../../constants/templateEditorConstants";
import styles from "./TemplateEditorHeader.module.scss";

type TemplateEditorHeaderProps = {
  title: string;
  onBack: () => void;
};

export function TemplateEditorHeader({ title, onBack }: TemplateEditorHeaderProps) {
  return (
    <div className={styles.header}>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        aria-label={TEMPLATE_EDITOR_LABELS.backAriaLabel}
        onClick={onBack}
      />
      <Typography.Title level={2} className={styles.title}>
        {title}
      </Typography.Title>
    </div>
  );
}
