"use client";

import { Form, Input, Modal } from "antd";
import { PROFILE_LABELS } from "../../constants/profileConstants";
import type { PasswordFormInstance, PasswordFormValues } from "../../types/profileTypes";

type ChangePasswordModalProps = {
  form: PasswordFormInstance;
  open: boolean;
  saving: boolean;
  onCancel: () => void;
  onSubmit: () => void;
};

export function ChangePasswordModal({
  form,
  open,
  saving,
  onCancel,
  onSubmit,
}: ChangePasswordModalProps) {
  return (
    <Modal
      title={PROFILE_LABELS.passwordModalTitle}
      open={open}
      onCancel={onCancel}
      confirmLoading={saving}
      onOk={onSubmit}
      okText={PROFILE_LABELS.saveButton}
      cancelText={PROFILE_LABELS.cancelButton}
    >
      <Form<PasswordFormValues> layout="vertical" form={form}>
        <Form.Item
          label={PROFILE_LABELS.currentPasswordLabel}
          name="currentPassword"
          rules={[{ required: true, message: PROFILE_LABELS.requiredCurrentPassword }]}
        >
          <Input.Password autoComplete="current-password" />
        </Form.Item>
        <Form.Item
          label={PROFILE_LABELS.newPasswordLabel}
          name="newPassword"
          rules={[
            { required: true, message: PROFILE_LABELS.requiredNewPassword },
            { min: 6, message: PROFILE_LABELS.minPassword },
            { max: 128, message: PROFILE_LABELS.tooLongPassword },
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          label={PROFILE_LABELS.confirmPasswordLabel}
          name="confirmPassword"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: PROFILE_LABELS.requiredConfirmPassword },
            { min: 6, message: PROFILE_LABELS.minPassword },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value) {
                  return Promise.resolve();
                }

                return Promise.reject(new Error(PROFILE_LABELS.passwordMismatch));
              },
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
