"use client";

import { GlobalOutlined } from "@ant-design/icons";
import { Form, Input, InputNumber, Select } from "antd";
import { filterTimezoneOption, type TimezoneSelectOption } from "@/shared/constants/timezones";
import { PROFILE_LABELS } from "../../constants/profileConstants";
import type { ProfileFormValues } from "../../types/profileTypes";
import styles from "./TrainingProfileFields.module.scss";

type TrainingProfileFieldsProps = {
  timezoneOptions: TimezoneSelectOption[];
};

export function TrainingProfileFields({ timezoneOptions }: TrainingProfileFieldsProps) {
  return (
    <div className={styles.fields}>
      <Form.Item<ProfileFormValues>
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
        <InputNumber
          className={styles.control}
          min={50}
          max={250}
          precision={0}
          inputMode="numeric"
        />
      </Form.Item>
      <Form.Item<ProfileFormValues>
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
        <InputNumber
          className={styles.control}
          min={0}
          max={21}
          precision={0}
          inputMode="numeric"
        />
      </Form.Item>
      <Form.Item<ProfileFormValues>
        className={styles.wide}
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
          suffixIcon={<GlobalOutlined aria-hidden />}
          options={timezoneOptions}
          optionFilterProp="label"
          filterOption={filterTimezoneOption}
        />
      </Form.Item>
      <Form.Item<ProfileFormValues>
        className={styles.wide}
        label={PROFILE_LABELS.miscellaneousLabel}
        name="miscellaneous"
        rules={[
          {
            max: 2000,
            message: PROFILE_LABELS.tooLongMiscellaneous,
          },
        ]}
      >
        <Input.TextArea rows={4} />
      </Form.Item>
    </div>
  );
}
