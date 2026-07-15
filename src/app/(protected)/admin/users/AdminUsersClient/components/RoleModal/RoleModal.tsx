"use client";

import { Form, Modal, Select } from "antd";
import { ADMIN_USERS_LABELS, ROLE_OPTIONS } from "../../constants/adminUsersConstants";
import type { RoleFormInstance } from "../../types/adminUsersTypes";
import styles from "./RoleModal.module.scss";

const ROLE_FORM_ID = "admin-user-role-form";

type RoleModalProps = {
  form: RoleFormInstance;
  open: boolean;
  activeUserLabel: string;
  saving: boolean;
  hasActiveUser: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  onAfterClose: () => void;
};

export function RoleModal({
  form,
  open,
  activeUserLabel,
  saving,
  hasActiveUser,
  onSubmit,
  onCancel,
  onAfterClose,
}: RoleModalProps) {
  return (
    <Modal
      className={styles.modal}
      title={`${ADMIN_USERS_LABELS.roleModalTitle}: ${activeUserLabel}`}
      open={open}
      width="min(520px, calc(100vw - 24px))"
      onCancel={onCancel}
      afterOpenChange={(isOpen) => {
        if (!isOpen) {
          onAfterClose();
        }
      }}
      okText={ADMIN_USERS_LABELS.saveButton}
      cancelText={ADMIN_USERS_LABELS.cancelButton}
      confirmLoading={saving}
      okButtonProps={{ disabled: !hasActiveUser, htmlType: "submit", form: ROLE_FORM_ID }}
    >
      <p className={styles.description}>{ADMIN_USERS_LABELS.roleModalDescription}</p>
      <Form
        id={ROLE_FORM_ID}
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={onSubmit}
      >
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
