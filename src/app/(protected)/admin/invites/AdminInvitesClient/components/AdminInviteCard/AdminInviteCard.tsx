import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  LockOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { ADMIN_INVITES_LABELS, STATUS_META } from "../../constants/adminInvitesConstants";
import type { AdminInviteRow, InviteStatus } from "../../types/adminInvitesTypes";
import {
  buildInviteUrl,
  formatDate,
  getInviteNumber,
  getRoleMeta,
  getUserLabel,
} from "../../utils/adminInvitesUtils";
import styles from "./AdminInviteCard.module.scss";

type AdminInviteCardProps = {
  invite: AdminInviteRow;
  token?: string;
  onCopy: (value: string) => void;
};

function getStatusIcon(status: InviteStatus) {
  switch (status) {
    case "active":
      return <ClockCircleOutlined aria-hidden />;
    case "used":
      return <CheckCircleOutlined aria-hidden />;
    case "expired":
      return <StopOutlined aria-hidden />;
  }
}

export function AdminInviteCard({ invite, token, onCopy }: AdminInviteCardProps) {
  const inviteNumber = getInviteNumber(invite.id);
  const statusMeta = STATUS_META[invite.status];
  const roleMeta = getRoleMeta(invite.role);
  const inviteUrl = token && invite.status === "active" ? buildInviteUrl(token) : "";
  const hasAvailableLink = inviteUrl.length > 0;
  const unavailableTitle =
    invite.status === "active"
      ? ADMIN_INVITES_LABELS.hiddenLinkTitle
      : ADMIN_INVITES_LABELS.unavailableLink;
  const unavailableNote =
    invite.status === "active" ? ADMIN_INVITES_LABELS.hiddenLinkNote : statusMeta.label;

  return (
    <article className={styles.card} data-status={statusMeta.tone}>
      <div className={styles.topline}>
        <span className={styles.number}>
          {ADMIN_INVITES_LABELS.inviteNumberLabel} {inviteNumber}
        </span>
        <span className={styles.status} data-status={statusMeta.tone}>
          {getStatusIcon(invite.status)}
          <span>{statusMeta.label}</span>
        </span>
      </div>

      <div className={styles.roleRow}>
        <span className={styles.roleBadge} data-role={roleMeta.tone}>
          {roleMeta.label}
        </span>
      </div>

      <dl className={styles.details}>
        <div className={styles.detailWide}>
          <dt>{ADMIN_INVITES_LABELS.createdByLabel}</dt>
          <dd>{getUserLabel(invite.createdBy)}</dd>
        </div>
        <div className={styles.detail}>
          <dt>{ADMIN_INVITES_LABELS.createdAtLabel}</dt>
          <dd>{formatDate(invite.createdAt)}</dd>
        </div>
        <div className={styles.detail}>
          <dt>{ADMIN_INVITES_LABELS.expiresAtLabel}</dt>
          <dd>{formatDate(invite.expiresAt)}</dd>
        </div>
        <div className={styles.detail}>
          <dt>{ADMIN_INVITES_LABELS.usedByLabel}</dt>
          <dd>{getUserLabel(invite.usedBy)}</dd>
        </div>
        <div className={styles.detail}>
          <dt>{ADMIN_INVITES_LABELS.usedAtLabel}</dt>
          <dd>{formatDate(invite.usedAt)}</dd>
        </div>
      </dl>

      {hasAvailableLink ? (
        <Button
          className={styles.copyButton}
          icon={<CopyOutlined aria-hidden />}
          aria-label={`${ADMIN_INVITES_LABELS.copyButton} ${inviteNumber}`}
          onClick={() => {
            onCopy(inviteUrl);
          }}
        >
          {ADMIN_INVITES_LABELS.copyButton}
        </Button>
      ) : (
        <div className={styles.linkState}>
          <LockOutlined aria-hidden />
          <div>
            <span className={styles.linkStateTitle}>{unavailableTitle}</span>
            <span className={styles.linkStateNote}>{unavailableNote}</span>
          </div>
        </div>
      )}
    </article>
  );
}
