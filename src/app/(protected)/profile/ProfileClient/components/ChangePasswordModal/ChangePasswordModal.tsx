"use client";

import { Form, Input, Modal } from "antd";
import { PROFILE_FORM_IDS, PROFILE_LABELS } from "../../constants/profileConstants";
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
      okText={PROFILE_LABELS.saveButton}
      okButtonProps={{ size: "large", htmlType: "submit", form: PROFILE_FORM_IDS.PASSWORD }}
      cancelText={PROFILE_LABELS.cancelButton}
      cancelButtonProps={{ size: "large" }}
    >
      <Form<PasswordFormValues>
        id={PROFILE_FORM_IDS.PASSWORD}
        layout="vertical"
        size="large"
        form={form}
        onFinish={onSubmit}
        onKeyDown={(event) => {
          if (event.key !== "Enter") {
            return;
          }

          event.preventDefault();
          form.submit();
        }}
        scrollToFirstError={{ focus: true }}
      >
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
        <button type="submit" hidden aria-hidden tabIndex={-1} />
      </Form>
    </Modal>
  );
}
