"use client";

import { DeleteOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { PROFILE_LABELS, PROFILE_SECTIONS } from "../../constants/profileConstants";
import { ProfileSection } from "../ProfileSection/ProfileSection";
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
    <ProfileSection
      id={PROFILE_SECTIONS.DANGER.id}
      index={PROFILE_SECTIONS.DANGER.index}
      title={PROFILE_SECTIONS.DANGER.title}
      description={PROFILE_SECTIONS.DANGER.description}
    >
      <div className={styles.action}>
        <Button
          danger
          size="large"
          icon={<DeleteOutlined aria-hidden />}
          onClick={onOpenDeleteModal}
        >
          {PROFILE_LABELS.deleteProfileButton}
        </Button>
      </div>
    </ProfileSection>
  );
}
