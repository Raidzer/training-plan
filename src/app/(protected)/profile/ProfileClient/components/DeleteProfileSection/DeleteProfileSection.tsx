"use client";

import { DeleteOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";
import { PROFILE_LABELS } from "../../constants/profileConstants";
import styles from "./DeleteProfileSection.module.scss";

type DeleteProfileSectionProps = {
  canDeleteProfile: boolean;
  onOpenDeleteModal: () => void;
};

export function DeleteProfileSection({
  canDeleteProfile,
  onOpenDeleteModal,
}: DeleteProfileSectionProps) {
  if (!canDeleteProfile) {
    return null;
  }

  return (
    <section className={styles.section}>
      <div className={styles.content}>
        <Typography.Title level={3} className={styles.title}>
          {PROFILE_LABELS.deleteProfileTitle}
        </Typography.Title>
        <Typography.Paragraph type="secondary" className={styles.description}>
          {PROFILE_LABELS.deleteProfileDescription}
        </Typography.Paragraph>
      </div>
      <Button danger icon={<DeleteOutlined />} onClick={onOpenDeleteModal}>
        {PROFILE_LABELS.deleteProfileButton}
      </Button>
    </section>
  );
}
