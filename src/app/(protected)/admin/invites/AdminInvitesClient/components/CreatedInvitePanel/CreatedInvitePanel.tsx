"use client";

import { CheckCircleOutlined, CopyOutlined } from "@ant-design/icons";
import { Button, Input } from "antd";
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
    <section className={styles.createdInvite} role="status" aria-labelledby="created-invite-title">
      <div className={styles.heading}>
        <CheckCircleOutlined className={styles.icon} aria-hidden />
        <div>
          <h3 id="created-invite-title" className={styles.title}>
            {ADMIN_INVITES_LABELS.linkCreatedTitle}
          </h3>
          <p className={styles.note} id="created-invite-note">
            {ADMIN_INVITES_LABELS.linkCreatedNote}
          </p>
        </div>
      </div>
      <label className={styles.label} htmlFor="created-invite-url">
        {ADMIN_INVITES_LABELS.createdLinkLabel}
      </label>
      <div className={styles.linkRow}>
        <Input
          id="created-invite-url"
          className={styles.linkInput}
          value={inviteUrl}
          readOnly
          aria-describedby="created-invite-note"
        />
        <Button
          icon={<CopyOutlined aria-hidden />}
          aria-label={ADMIN_INVITES_LABELS.copyCreatedInviteButton}
          onClick={() => {
            onCopy(inviteUrl);
          }}
        >
          {ADMIN_INVITES_LABELS.copyButton}
        </Button>
      </div>
    </section>
  );
}
