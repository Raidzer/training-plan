"use client";

import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Radio } from "antd";
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
    <Form<InviteFormValues>
      className={styles.form}
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      requiredMark={false}
    >
      <Form.Item
        name="role"
        label={<span id="admin-invite-role-label">{ADMIN_INVITES_LABELS.roleLabel}</span>}
        extra={<span id="admin-invite-role-hint">{ADMIN_INVITES_LABELS.roleHint}</span>}
        rules={[
          {
            required: true,
            message: ADMIN_INVITES_LABELS.selectRole,
          },
        ]}
      >
        <Radio.Group
          id="admin-invite-role"
          aria-labelledby="admin-invite-role-label"
          aria-describedby="admin-invite-role-hint"
          aria-required="true"
          options={ROLE_OPTIONS}
          optionType="button"
          buttonStyle="solid"
          block
        />
      </Form.Item>
      <Button
        className={styles.submitButton}
        type="primary"
        htmlType="submit"
        icon={<PlusOutlined aria-hidden />}
        loading={creating}
        disabled={creating}
      >
        {ADMIN_INVITES_LABELS.createButton}
      </Button>
    </Form>
  );
}
