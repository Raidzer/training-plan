"use client";

import { Form } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { buildTimezoneOptions } from "@/shared/constants/timezones";
import { PROFILE_LABELS } from "../constants/profileConstants";
import type {
  EmailApiResponse,
  EmailFormValues,
  PasswordApiResponse,
  PasswordFormValues,
  ProfileApiResponse,
  ProfileFormValues,
  ProfileUserData,
} from "../types/profileTypes";
import {
  hasProfileValuesChanged,
  normalizeProfileUserData,
  normalizeProfileValues,
  readJson,
  toProfileFormValues,
} from "../utils/profileUtils";

type UseProfileClientParams = {
  initialUserData: ProfileUserData;
  messageApi: MessageInstance;
};

export const useProfileClient = ({ initialUserData, messageApi }: UseProfileClientParams) => {
  const { data: session, update } = useSession();
  const [profileForm] = Form.useForm<ProfileFormValues>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();
  const [emailForm] = Form.useForm<EmailFormValues>();
  const [userData, setUserData] = useState(() => normalizeProfileUserData(initialUserData));
  const [formValues, setFormValues] = useState<ProfileFormValues>(() =>
    toProfileFormValues(initialUserData)
  );
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  const initialValues = useMemo(() => toProfileFormValues(userData), [userData]);
  const hasProfileChanges = useMemo(
    () => hasProfileValuesChanged(initialValues, formValues),
    [formValues, initialValues]
  );
  const isEmailVerified = Boolean(session?.user?.emailVerified);

  const timezoneOptions = useMemo(() => {
    return buildTimezoneOptions(new Date(), [userData.timezone]);
  }, [userData.timezone]);

  const applyUserData = (nextUserData: ProfileApiResponse["user"]) => {
    if (!nextUserData) {
      return;
    }
    const normalizedUserData = normalizeProfileUserData(nextUserData);
    const nextFormValues = toProfileFormValues(normalizedUserData);
    setUserData(normalizedUserData);
    setFormValues(nextFormValues);
    profileForm.setFieldsValue(nextFormValues);
  };

  const handleProfileValuesChange = (
    _changedValues: Partial<ProfileFormValues>,
    allValues: ProfileFormValues
  ) => {
    setFormValues({
      ...initialValues,
      ...allValues,
    });
  };

  const handleSaveProfile = async () => {
    const values = await profileForm.validateFields();
    const payload = normalizeProfileValues(values);
    setSavingProfile(true);

    try {
      const response = await fetch("/api/setDataUser", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await readJson<ProfileApiResponse>(response);

      if (!response.ok || !data?.success || !data.user) {
        messageApi.error(PROFILE_LABELS.profileUpdateFail);
        return;
      }

      applyUserData(data.user);
      await update();
      messageApi.success(PROFILE_LABELS.profileUpdateOk);
    } catch {
      messageApi.error(PROFILE_LABELS.profileUpdateError);
    } finally {
      setSavingProfile(false);
    }
  };

  const openPasswordModal = () => {
    passwordForm.resetFields();
    setPasswordModalOpen(true);
  };

  const openEmailModal = () => {
    emailForm.setFieldsValue({
      email: userData.email,
      currentPassword: "",
    });
    setEmailModalOpen(true);
  };

  const closePasswordModal = () => {
    setPasswordModalOpen(false);
    passwordForm.resetFields();
  };

  const closeEmailModal = () => {
    setEmailModalOpen(false);
    emailForm.resetFields();
  };

  const handleChangePassword = async () => {
    const values = await passwordForm.validateFields();
    setSavingPassword(true);

    try {
      const response = await fetch("/api/setUserPassword", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await readJson<PasswordApiResponse>(response);

      if (response.status === 403 && data?.error === "invalid_current_password") {
        passwordForm.setFields([
          {
            name: "currentPassword",
            errors: [PROFILE_LABELS.invalidCurrentPassword],
          },
        ]);
        return;
      }

      if (!response.ok || !data?.success) {
        messageApi.error(PROFILE_LABELS.passwordUpdateFail);
        return;
      }

      messageApi.success(PROFILE_LABELS.passwordUpdateOk);
      closePasswordModal();
    } catch {
      messageApi.error(PROFILE_LABELS.passwordUpdateError);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    const values = await emailForm.validateFields();
    setSavingEmail(true);

    try {
      const response = await fetch("/api/profile/email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await readJson<EmailApiResponse>(response);

      if (response.status === 403 && data?.error === "invalid_current_password") {
        emailForm.setFields([
          {
            name: "currentPassword",
            errors: [PROFILE_LABELS.invalidCurrentPassword],
          },
        ]);
        return;
      }

      if (response.status === 409 && data?.error === "email_conflict") {
        emailForm.setFields([
          {
            name: "email",
            errors: [PROFILE_LABELS.emailConflict],
          },
        ]);
        return;
      }

      if (response.status === 400 && data?.error === "email_unchanged") {
        emailForm.setFields([
          {
            name: "email",
            errors: [PROFILE_LABELS.emailUnchanged],
          },
        ]);
        return;
      }

      if (!response.ok || !data?.success || !data.user) {
        messageApi.error(PROFILE_LABELS.emailUpdateFail);
        return;
      }

      applyUserData(data.user);
      await update();
      closeEmailModal();

      if (data.emailSent) {
        messageApi.success(PROFILE_LABELS.emailUpdateOk);
      } else {
        messageApi.warning(PROFILE_LABELS.emailUpdateWarning);
      }
    } catch {
      messageApi.error(PROFILE_LABELS.emailUpdateError);
    } finally {
      setSavingEmail(false);
    }
  };

  return {
    profileForm,
    passwordForm,
    emailForm,
    userData,
    initialValues,
    timezoneOptions,
    hasProfileChanges,
    isEmailVerified,
    passwordModalOpen,
    emailModalOpen,
    savingProfile,
    savingPassword,
    savingEmail,
    handleProfileValuesChange,
    handleSaveProfile,
    openPasswordModal,
    openEmailModal,
    closePasswordModal,
    closeEmailModal,
    handleChangePassword,
    handleChangeEmail,
  };
};
