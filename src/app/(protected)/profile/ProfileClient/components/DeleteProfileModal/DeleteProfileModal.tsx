"use client";

import { Form, Input, Modal, Typography } from "antd";
import { PROFILE_LABELS } from "../../constants/profileConstants";
import type { DeleteProfileFormInstance, DeleteProfileFormValues } from "../../types/profileTypes";

type DeleteProfileModalProps = {
  form: DeleteProfileFormInstance;
  open: boolean;
  saving: boolean;
  onCancel: () => void;
  onSubmit: () => void;
};

export function DeleteProfileModal({
  form,
  open,
  saving,
  onCancel,
  onSubmit,
}: DeleteProfileModalProps) {
  return (
    <Modal
      title={PROFILE_LABELS.deleteProfileTitle}
      open={open}
      onCancel={onCancel}
      confirmLoading={saving}
      onOk={onSubmit}
      okText={PROFILE_LABELS.deleteProfileOk}
      okButtonProps={{ danger: true }}
      cancelText={PROFILE_LABELS.cancelButton}
    >
      <Typography.Paragraph type="secondary">
        {PROFILE_LABELS.deleteProfileConfirmText}
      </Typography.Paragraph>
      <Form<DeleteProfileFormValues> layout="vertical" form={form}>
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
