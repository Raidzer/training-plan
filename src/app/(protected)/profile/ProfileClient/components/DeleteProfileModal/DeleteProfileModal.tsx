"use client";

import { Form, Input, Modal, Typography } from "antd";
import { PROFILE_FORM_IDS, PROFILE_LABELS } from "../../constants/profileConstants";
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
      okText={PROFILE_LABELS.deleteProfileOk}
      okButtonProps={{
        danger: true,
        size: "large",
        htmlType: "submit",
        form: PROFILE_FORM_IDS.DELETE,
      }}
      cancelText={PROFILE_LABELS.cancelButton}
      cancelButtonProps={{ size: "large" }}
    >
      <Typography.Paragraph>{PROFILE_LABELS.deleteProfileDescription}</Typography.Paragraph>
      <Typography.Paragraph type="secondary">
        {PROFILE_LABELS.deleteProfileConfirmText}
      </Typography.Paragraph>
      <Form<DeleteProfileFormValues>
        id={PROFILE_FORM_IDS.DELETE}
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
        <button type="submit" hidden aria-hidden tabIndex={-1} />
      </Form>
    </Modal>
  );
}
