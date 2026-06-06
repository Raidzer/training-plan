"use client";

import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Select } from "antd";
import { ADMIN_INVITES_LABELS, ROLE_OPTIONS } from "../../constants/adminInvitesConstants";
import type { InviteFormInstance, InviteFormValues } from "../../types/adminInvitesTypes";
import styles from "./InviteCreateForm.module.scss";

type InviteCreateFormProps = {
  form: InviteFormInstance;
  creating: boolean;
  onSubmit: (values: InviteFormValues) => void;
};

export function InviteCreateForm({ form, creating, onSubmit }: InviteCreateFormProps) {
  return (
    <Form<InviteFormValues> form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
      <div className={styles.formRow}>
        <Form.Item
          name="role"
          label={ADMIN_INVITES_LABELS.roleLabel}
          rules={[
            {
              required: true,
              message: ADMIN_INVITES_LABELS.selectRole,
            },
          ]}
        >
          <Select options={ROLE_OPTIONS} placeholder={ADMIN_INVITES_LABELS.selectRole} />
        </Form.Item>
        <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={creating}>
          {ADMIN_INVITES_LABELS.createButton}
        </Button>
      </div>
    </Form>
  );
}
