"use client";

import { DatePicker, Form, Input, Select } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import {
  GENDER_OPTIONS,
  OCCUPATION_OPTIONS,
  PROFILE_DATE_DISPLAY_FORMAT,
  PROFILE_LABELS,
} from "../../constants/profileConstants";
import type { ProfileFormValues } from "../../types/profileTypes";
import styles from "./PersonalDetailsFields.module.scss";

const disableFutureDate = (currentDate: Dayjs) => currentDate.isAfter(dayjs(), "day");

export function PersonalDetailsFields() {
  return (
    <div className={styles.fields}>
      <Form.Item<ProfileFormValues>
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
        <Input autoComplete="given-name" />
      </Form.Item>
      <Form.Item<ProfileFormValues>
        label={PROFILE_LABELS.lastNameLabel}
        name="lastName"
        rules={[{ max: 255 }]}
      >
        <Input autoComplete="family-name" />
      </Form.Item>
      <Form.Item<ProfileFormValues>
        label={PROFILE_LABELS.patronymicLabel}
        name="patronymic"
        rules={[
          {
            max: 255,
            message: PROFILE_LABELS.tooLongPatronymic,
          },
        ]}
      >
        <Input autoComplete="additional-name" />
      </Form.Item>
      <Form.Item<ProfileFormValues>
        label={PROFILE_LABELS.genderLabel}
        name="gender"
        rules={[{ required: true }]}
      >
        <Select options={GENDER_OPTIONS} />
      </Form.Item>
      <Form.Item<ProfileFormValues> label={PROFILE_LABELS.dateOfBirthLabel} name="dateOfBirth">
        <DatePicker
          allowClear
          className={styles.control}
          disabledDate={disableFutureDate}
          format={PROFILE_DATE_DISPLAY_FORMAT}
        />
      </Form.Item>
      <Form.Item<ProfileFormValues> label={PROFILE_LABELS.occupationLabel} name="occupation">
        <Select allowClear options={OCCUPATION_OPTIONS} />
      </Form.Item>
    </div>
  );
}
