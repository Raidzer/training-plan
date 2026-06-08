"use client";

import { Form, Modal, Select } from "antd";
import { ADMIN_USERS_LABELS, ROLE_OPTIONS } from "../../constants/adminUsersConstants";
import type { RoleFormInstance } from "../../types/adminUsersTypes";

type RoleModalProps = {
  form: RoleFormInstance;
  open: boolean;
  activeUserLabel: string;
  saving: boolean;
  hasActiveUser: boolean;
  onSubmit: () => void;
  onCancel: () => void;
};

export function RoleModal({
  form,
  open,
  activeUserLabel,
  saving,
  hasActiveUser,
  onSubmit,
  onCancel,
}: RoleModalProps) {
  return (
    <Modal
      title={`${ADMIN_USERS_LABELS.roleModalTitle}: ${activeUserLabel}`}
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
          name="role"
          label={ADMIN_USERS_LABELS.roleColumn}
          rules={[
            {
              required: true,
              message: ADMIN_USERS_LABELS.selectRoleRequired,
            },
          ]}
        >
          <Select options={ROLE_OPTIONS} placeholder={ADMIN_USERS_LABELS.selectRolePlaceholder} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
