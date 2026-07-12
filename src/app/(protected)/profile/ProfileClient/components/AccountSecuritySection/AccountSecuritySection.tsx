"use client";

import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LockOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import clsx from "clsx";
import { PROFILE_LABELS, PROFILE_SECTIONS } from "../../constants/profileConstants";
import { ProfileSection } from "../ProfileSection/ProfileSection";
import styles from "./AccountSecuritySection.module.scss";

type AccountSecuritySectionProps = {
  email: string;
  isEmailVerified: boolean;
  onOpenEmailModal: () => void;
  onOpenPasswordModal: () => void;
};

export function AccountSecuritySection({
  email,
  isEmailVerified,
  onOpenEmailModal,
  onOpenPasswordModal,
}: AccountSecuritySectionProps) {
  return (
    <ProfileSection
      id={PROFILE_SECTIONS.SECURITY.id}
      index={PROFILE_SECTIONS.SECURITY.index}
      title={PROFILE_SECTIONS.SECURITY.title}
      description={PROFILE_SECTIONS.SECURITY.description}
    >
      <div className={styles.rows}>
        <div className={styles.row}>
          <span className={styles.icon} aria-hidden>
            <MailOutlined />
          </span>
          <div className={styles.details}>
            <h3 className={styles.label}>{PROFILE_LABELS.emailAccountLabel}</h3>
            <span className={styles.value}>{email}</span>
            <span
              className={clsx(
                styles.verification,
                isEmailVerified ? styles.verified : styles.unverified
              )}
            >
              {isEmailVerified ? (
                <CheckCircleOutlined aria-hidden />
              ) : (
                <ExclamationCircleOutlined aria-hidden />
              )}
              <span>
                {isEmailVerified
                  ? PROFILE_LABELS.emailVerifiedStatus
                  : PROFILE_LABELS.emailUnverifiedStatus}
              </span>
            </span>
          </div>
          <Button size="large" onClick={onOpenEmailModal}>
            {PROFILE_LABELS.changeEmailButton}
          </Button>
        </div>

        <div className={styles.row}>
          <span className={styles.icon} aria-hidden>
            <LockOutlined />
          </span>
          <div className={styles.details}>
            <h3 className={styles.label}>{PROFILE_LABELS.passwordAccountLabel}</h3>
            <span className={styles.value}>{PROFILE_LABELS.passwordMaskedValue}</span>
            <span className={styles.hint}>{PROFILE_LABELS.passwordDescription}</span>
          </div>
          <Button size="large" onClick={onOpenPasswordModal}>
            {PROFILE_LABELS.changePasswordButton}
          </Button>
        </div>
      </div>
    </ProfileSection>
  );
}
