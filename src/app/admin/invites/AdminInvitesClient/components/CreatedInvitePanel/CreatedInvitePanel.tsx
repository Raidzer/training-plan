"use client";

import { CopyOutlined } from "@ant-design/icons";
import { Button, Input, Typography } from "antd";
import { ADMIN_INVITES_LABELS } from "../../constants/adminInvitesConstants";
import styles from "./CreatedInvitePanel.module.scss";

type CreatedInvitePanelProps = {
  inviteUrl: string;
  onCopy: (value: string) => void;
};

export function CreatedInvitePanel({ inviteUrl, onCopy }: CreatedInvitePanelProps) {
  if (!inviteUrl) {
    return null;
  }

  return (
    <div className={styles.createdInvite}>
      <Typography.Text strong>{ADMIN_INVITES_LABELS.linkCreatedTitle}</Typography.Text>
      <div className={styles.linkRow}>
        <Input className={styles.linkInput} value={inviteUrl} readOnly />
        <Button
          icon={<CopyOutlined />}
          onClick={() => {
            onCopy(inviteUrl);
          }}
        >
          {ADMIN_INVITES_LABELS.copyButton}
        </Button>
      </div>
      <Typography.Text type="secondary">{ADMIN_INVITES_LABELS.linkCreatedNote}</Typography.Text>
    </div>
  );
}
