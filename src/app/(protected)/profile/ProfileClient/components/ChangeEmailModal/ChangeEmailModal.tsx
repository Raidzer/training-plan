"use client";

import { Form, Input, Modal } from "antd";
import { PROFILE_LABELS } from "../../constants/profileConstants";
import type { EmailFormInstance, EmailFormValues } from "../../types/profileTypes";

type ChangeEmailModalProps = {
  form: EmailFormInstance;
  open: boolean;
  saving: boolean;
  onCancel: () => void;
  onSubmit: () => void;
};

export function ChangeEmailModal({
  form,
  open,
  saving,
  onCancel,
  onSubmit,
}: ChangeEmailModalProps) {
  return (
    <Modal
      title={PROFILE_LABELS.emailModalTitle}
      open={open}
      onCancel={onCancel}
      confirmLoading={saving}
      onOk={onSubmit}
      okText={PROFILE_LABELS.saveButton}
      cancelText={PROFILE_LABELS.cancelButton}
    >
      <Form<EmailFormValues> layout="vertical" form={form}>
        <Form.Item
          label={PROFILE_LABELS.newEmailLabel}
          name="email"
          rules={[
            { required: true, message: PROFILE_LABELS.requiredNewEmail },
            { type: "email", message: PROFILE_LABELS.invalidEmail },
            { max: 255, message: PROFILE_LABELS.tooLongEmail },
          ]}
        >
          <Input autoComplete="email" />
        </Form.Item>
        <Form.Item
          label={PROFILE_LABELS.currentPasswordLabel}
          name="currentPassword"
          rules={[{ required: true, message: PROFILE_LABELS.requiredCurrentPassword }]}
        >
          <Input.Password autoComplete="current-password" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
