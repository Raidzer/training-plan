"use client";

import { Form } from "antd";
import type { TimezoneSelectOption } from "@/shared/constants/timezones";
import { PROFILE_SECTIONS } from "../../constants/profileConstants";
import type { ProfileFormInstance, ProfileFormValues } from "../../types/profileTypes";
import { PersonalDetailsFields } from "../PersonalDetailsFields/PersonalDetailsFields";
import { ProfileSaveBar } from "../ProfileSaveBar/ProfileSaveBar";
import { ProfileSection } from "../ProfileSection/ProfileSection";
import { TrainingProfileFields } from "../TrainingProfileFields/TrainingProfileFields";
import styles from "./ProfileDetailsForm.module.scss";

type ProfileDetailsFormProps = {
  form: ProfileFormInstance;
  initialValues: ProfileFormValues;
  timezoneOptions: TimezoneSelectOption[];
  hasProfileChanges: boolean;
  savingProfile: boolean;
  onValuesChange: (changedValues: Partial<ProfileFormValues>, allValues: ProfileFormValues) => void;
  onSaveProfile: () => void;
};

export function ProfileDetailsForm({
  form,
  initialValues,
  timezoneOptions,
  hasProfileChanges,
  savingProfile,
  onValuesChange,
  onSaveProfile,
}: ProfileDetailsFormProps) {
  return (
    <Form<ProfileFormValues>
      form={form}
      initialValues={initialValues}
      size="large"
      className={styles.form}
      layout="vertical"
      onValuesChange={onValuesChange}
      onFinish={onSaveProfile}
      scrollToFirstError={{ behavior: "smooth", block: "center", focus: true }}
    >
      <ProfileSection
        id={PROFILE_SECTIONS.PERSONAL.id}
        index={PROFILE_SECTIONS.PERSONAL.index}
        title={PROFILE_SECTIONS.PERSONAL.title}
        description={PROFILE_SECTIONS.PERSONAL.description}
        className={styles.firstSection}
      >
        <PersonalDetailsFields />
      </ProfileSection>

      <ProfileSection
        id={PROFILE_SECTIONS.TRAINING.id}
        index={PROFILE_SECTIONS.TRAINING.index}
        title={PROFILE_SECTIONS.TRAINING.title}
        description={PROFILE_SECTIONS.TRAINING.description}
      >
        <TrainingProfileFields timezoneOptions={timezoneOptions} />
      </ProfileSection>

      <ProfileSaveBar hasProfileChanges={hasProfileChanges} savingProfile={savingProfile} />
    </Form>
  );
}
