"use client";

import { CheckCircleFilled, GlobalOutlined } from "@ant-design/icons";
import { Button, DatePicker, Form, Input, InputNumber, Select, Tooltip } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { filterTimezoneOption, type TimezoneSelectOption } from "@/shared/constants/timezones";
import {
  GENDER_OPTIONS,
  OCCUPATION_OPTIONS,
  PROFILE_DATE_DISPLAY_FORMAT,
  PROFILE_LABELS,
} from "../../constants/profileConstants";
import type {
  ProfileFormInstance,
  ProfileFormValues,
  ProfileUserData,
} from "../../types/profileTypes";
import styles from "./ProfileDetailsForm.module.scss";

const disableFutureDate = (currentDate: Dayjs) => currentDate.isAfter(dayjs(), "day");

type ProfileDetailsFormProps = {
  form: ProfileFormInstance;
  userData: ProfileUserData;
  initialValues: ProfileFormValues;
  timezoneOptions: TimezoneSelectOption[];
  hasProfileChanges: boolean;
  isEmailVerified: boolean;
  savingProfile: boolean;
  onValuesChange: (changedValues: Partial<ProfileFormValues>, allValues: ProfileFormValues) => void;
  onSaveProfile: () => void;
  onOpenEmailModal: () => void;
  onOpenPasswordModal: () => void;
};

export function ProfileDetailsForm({
  form,
  userData,
  initialValues,
  timezoneOptions,
  hasProfileChanges,
  isEmailVerified,
  savingProfile,
  onValuesChange,
  onSaveProfile,
  onOpenEmailModal,
  onOpenPasswordModal,
}: ProfileDetailsFormProps) {
  return (
    <Form<ProfileFormValues>
      form={form}
      initialValues={initialValues}
      size="large"
      className={styles.form}
      layout="vertical"
      onValuesChange={onValuesChange}
    >
      <Form.Item label={PROFILE_LABELS.loginLabel}>
        <Input value={userData.login} disabled />
      </Form.Item>
      <Form.Item
        label={PROFILE_LABELS.nameLabel}
        name="name"
        rules={[
          {
            required: true,
            whitespace: true,
            message: PROFILE_LABELS.requiredName,
          },
          { max: 255, message: PROFILE_LABELS.tooLongName },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item label={PROFILE_LABELS.lastNameLabel} name="lastName" rules={[{ max: 255 }]}>
        <Input />
      </Form.Item>
      <Form.Item
        label={PROFILE_LABELS.patronymicLabel}
        name="patronymic"
        rules={[
          {
            max: 255,
            message: PROFILE_LABELS.tooLongPatronymic,
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label={
          <span className={styles.emailLabel}>
            {PROFILE_LABELS.emailLabel}
            {isEmailVerified ? (
              <Tooltip title={PROFILE_LABELS.verifiedEmailTooltip}>
                <CheckCircleFilled
                  aria-label={PROFILE_LABELS.verifiedEmailAriaLabel}
                  className={styles.verifiedIcon}
                />
              </Tooltip>
            ) : null}
          </span>
        }
      >
        <Input value={userData.email} disabled />
      </Form.Item>
      <Form.Item label={PROFILE_LABELS.genderLabel} name="gender" rules={[{ required: true }]}>
        <Select options={GENDER_OPTIONS} />
      </Form.Item>
      <Form.Item label={PROFILE_LABELS.dateOfBirthLabel} name="dateOfBirth">
        <DatePicker
          allowClear
          className={styles.dateInput}
          disabledDate={disableFutureDate}
          format={PROFILE_DATE_DISPLAY_FORMAT}
        />
      </Form.Item>
      <Form.Item label={PROFILE_LABELS.occupationLabel} name="occupation">
        <Select allowClear options={OCCUPATION_OPTIONS} />
      </Form.Item>
      <Form.Item
        label={PROFILE_LABELS.heightCmLabel}
        name="heightCm"
        rules={[
          {
            type: "number",
            min: 50,
            max: 250,
            message: PROFILE_LABELS.invalidHeightCm,
          },
        ]}
      >
        <InputNumber className={styles.numberInput} min={50} max={250} precision={0} />
      </Form.Item>
      <Form.Item
        label={PROFILE_LABELS.weeklyWorkloadCountLabel}
        name="weeklyWorkloadCount"
        rules={[
          {
            type: "number",
            min: 0,
            max: 21,
            message: PROFILE_LABELS.invalidWeeklyWorkloadCount,
          },
        ]}
      >
        <InputNumber className={styles.numberInput} min={0} max={21} precision={0} />
      </Form.Item>
      <Form.Item
        label={PROFILE_LABELS.miscellaneousLabel}
        name="miscellaneous"
        rules={[
          {
            max: 2000,
            message: PROFILE_LABELS.tooLongMiscellaneous,
          },
        ]}
      >
        <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
      </Form.Item>
      <Form.Item
        label={PROFILE_LABELS.timezoneLabel}
        name="timezone"
        rules={[
          {
            required: true,
            message: PROFILE_LABELS.requiredTimezone,
          },
        ]}
      >
        <Select
          showSearch
          suffixIcon={<GlobalOutlined />}
          options={timezoneOptions}
          optionFilterProp="label"
          filterOption={filterTimezoneOption}
        />
      </Form.Item>
      <div className={styles.actions}>
        <Button
          type="primary"
          disabled={!hasProfileChanges}
          loading={savingProfile}
          onClick={onSaveProfile}
        >
          {PROFILE_LABELS.saveButton}
        </Button>
        <Button onClick={onOpenEmailModal}>{PROFILE_LABELS.changeEmailButton}</Button>
        <Button onClick={onOpenPasswordModal}>{PROFILE_LABELS.changePasswordButton}</Button>
      </div>
    </Form>
  );
}
