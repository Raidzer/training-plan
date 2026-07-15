"use client";

import { Form, Input, Modal } from "antd";
import { PROFILE_FORM_IDS, PROFILE_LABELS } from "../../constants/profileConstants";
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
      okText={PROFILE_LABELS.saveButton}
      okButtonProps={{ size: "large", htmlType: "submit", form: PROFILE_FORM_IDS.EMAIL }}
      cancelText={PROFILE_LABELS.cancelButton}
      cancelButtonProps={{ size: "large" }}
    >
      <Form<EmailFormValues>
        id={PROFILE_FORM_IDS.EMAIL}
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
        <button type="submit" hidden aria-hidden tabIndex={-1} />
      </Form>
    </Modal>
  );
}
