"use client";

import { Form, Input, Modal } from "antd";
import { ADMIN_USERS_LABELS, PASSWORD_MIN_LENGTH } from "../../constants/adminUsersConstants";
import type { PasswordFormInstance } from "../../types/adminUsersTypes";

type PasswordModalProps = {
  form: PasswordFormInstance;
  open: boolean;
  activeUserLabel: string;
  saving: boolean;
  hasActiveUser: boolean;
  onSubmit: () => void;
  onCancel: () => void;
};

export function PasswordModal({
  form,
  open,
  activeUserLabel,
  saving,
  hasActiveUser,
  onSubmit,
  onCancel,
}: PasswordModalProps) {
  return (
    <Modal
      title={`${ADMIN_USERS_LABELS.passwordModalTitle}: ${activeUserLabel}`}
      open={open}
      width="min(520px, calc(100vw - 24px))"
      onOk={onSubmit}
      onCancel={onCancel}
      okText={ADMIN_USERS_LABELS.saveButton}
      cancelText={ADMIN_USERS_LABELS.cancelButton}
      confirmLoading={saving}
      okButtonProps={{ disabled: !hasActiveUser }}
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          name="newPassword"
          label={ADMIN_USERS_LABELS.newPasswordLabel}
          rules={[
            { required: true, message: ADMIN_USERS_LABELS.newPasswordRequired },
            {
              min: PASSWORD_MIN_LENGTH,
              message: `Минимум ${PASSWORD_MIN_LENGTH} символов`,
            },
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label={ADMIN_USERS_LABELS.confirmPasswordLabel}
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: ADMIN_USERS_LABELS.confirmPasswordRequired },
            ({ getFieldValue }) => ({
              validator(_, value) {
                const original = getFieldValue("newPassword");

                if (!value || value === original) {
                  return Promise.resolve();
                }

                return Promise.reject(new Error(ADMIN_USERS_LABELS.passwordMismatch));
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
