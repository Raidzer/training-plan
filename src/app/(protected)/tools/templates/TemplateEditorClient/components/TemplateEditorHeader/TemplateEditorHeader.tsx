"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { TEMPLATE_EDITOR_LABELS } from "../../constants/templateEditorConstants";
import type { TemplateSaveStatus } from "../../types/templateEditorTypes";
import styles from "./TemplateEditorHeader.module.scss";

type TemplateEditorHeaderProps = {
  title: string;
  subtitle: string;
  saveStatus: TemplateSaveStatus;
  saveStatusLabel: string;
  onBack: () => void;
};

export function TemplateEditorHeader({
  title,
  subtitle,
  saveStatus,
  saveStatusLabel,
  onBack,
}: TemplateEditorHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>{TEMPLATE_EDITOR_LABELS.eyebrow}</span>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>

      <div className={styles.meta}>
        <span className={styles.status} data-status={saveStatus}>
          <span className={styles.statusMarker} aria-hidden />
          {saveStatusLabel}
        </span>
        <Button
          size="large"
          icon={<ArrowLeftOutlined aria-hidden />}
          className={styles.backButton}
          onClick={onBack}
        >
          {TEMPLATE_EDITOR_LABELS.backButton}
        </Button>
      </div>
    </header>
  );
}
