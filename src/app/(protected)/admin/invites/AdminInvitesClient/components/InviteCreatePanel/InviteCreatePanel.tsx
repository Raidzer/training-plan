import {
  ClockCircleOutlined,
  EyeInvisibleOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { ADMIN_INVITES_LABELS } from "../../constants/adminInvitesConstants";
import type { InviteFormInstance, InviteFormValues } from "../../types/adminInvitesTypes";
import { CreatedInvitePanel } from "../CreatedInvitePanel/CreatedInvitePanel";
import { InviteCreateForm } from "../InviteCreateForm/InviteCreateForm";
import styles from "./InviteCreatePanel.module.scss";

type InviteCreatePanelProps = {
  form: InviteFormInstance;
  creating: boolean;
  inviteUrl: string;
  onSubmit: (values: InviteFormValues) => void;
  onCopy: (value: string) => void;
};

export function InviteCreatePanel({
  form,
  creating,
  inviteUrl,
  onSubmit,
  onCopy,
}: InviteCreatePanelProps) {
  const rules = [
    {
      icon: <ClockCircleOutlined aria-hidden />,
      label: ADMIN_INVITES_LABELS.validityLabel,
      value: ADMIN_INVITES_LABELS.validityValue,
    },
    {
      icon: <SafetyCertificateOutlined aria-hidden />,
      label: ADMIN_INVITES_LABELS.usageLabel,
      value: ADMIN_INVITES_LABELS.usageValue,
    },
    {
      icon: <EyeInvisibleOutlined aria-hidden />,
      label: ADMIN_INVITES_LABELS.visibilityLabel,
      value: ADMIN_INVITES_LABELS.visibilityValue,
    },
  ];

  return (
    <aside id="admin-invite-create" className={styles.panel} aria-labelledby="invite-create-title">
      <header className={styles.header}>
        <span className={styles.eyebrow}>{ADMIN_INVITES_LABELS.createPanelEyebrow}</span>
        <h2 id="invite-create-title" className={styles.title}>
          {ADMIN_INVITES_LABELS.createPanelTitle}
        </h2>
        <p className={styles.subtitle}>{ADMIN_INVITES_LABELS.createPanelSubtitle}</p>
      </header>

      <dl className={styles.rules}>
        {rules.map((rule) => (
          <div key={rule.label} className={styles.rule}>
            <span className={styles.ruleIcon}>{rule.icon}</span>
            <div>
              <dt>{rule.label}</dt>
              <dd>{rule.value}</dd>
            </div>
          </div>
        ))}
      </dl>

      <InviteCreateForm form={form} creating={creating} onSubmit={onSubmit} />
      <CreatedInvitePanel inviteUrl={inviteUrl} onCopy={onCopy} />
    </aside>
  );
}
