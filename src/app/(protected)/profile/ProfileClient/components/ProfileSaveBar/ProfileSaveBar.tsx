"use client";

import { CheckCircleOutlined, EditOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { PROFILE_LABELS } from "../../constants/profileConstants";
import styles from "./ProfileSaveBar.module.scss";

type ProfileSaveBarProps = {
  hasProfileChanges: boolean;
  savingProfile: boolean;
};

export function ProfileSaveBar({ hasProfileChanges, savingProfile }: ProfileSaveBarProps) {
  return (
    <div className={styles.bar}>
      <span className={styles.status} aria-live="polite">
        {hasProfileChanges ? <EditOutlined aria-hidden /> : <CheckCircleOutlined aria-hidden />}
        <span>{hasProfileChanges ? PROFILE_LABELS.dirtyState : PROFILE_LABELS.savedState}</span>
      </span>
      <Button
        type="primary"
        size="large"
        htmlType="submit"
        disabled={!hasProfileChanges}
        loading={savingProfile}
      >
        {PROFILE_LABELS.saveButton}
      </Button>
    </div>
  );
}
