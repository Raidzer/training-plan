"use client";

import { GlobalOutlined } from "@ant-design/icons";
import { App, Button, Card, Form, Input, Modal, Select } from "antd";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton/BackButton";
import { PageHeader } from "@/components/PageHeader";
import styles from "./ProfileForm.module.scss";

type Gender = "male" | "female";

type ProfileUserData = {
  id: string;
  email: string;
  name: string;
  lastName: string;
  gender: string;
  timezone: string;
};

type ProfileFormValues = {
  name: string;
  lastName: string;
  gender: Gender;
  timezone: string;
};

type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type ProfileApiResponse = {
  success?: boolean;
  error?: string;
  user?: ProfileUserData;
};

type PasswordApiResponse = {
  success?: boolean;
  error?: string;
};

interface ProfileFormProps {
  userData: ProfileUserData;
}

const DEFAULT_TIMEZONE = "Europe/Moscow";

const normalizeProfileValues = (values: ProfileFormValues) => ({
  name: values.name.trim(),
  lastName: values.lastName?.trim() ?? "",
  gender: values.gender,
  timezone: values.timezone,
});

const toProfileFormValues = (userData: ProfileUserData): ProfileFormValues => ({
  name: userData.name,
  lastName: userData.lastName,
  gender: userData.gender === "female" ? "female" : "male",
  timezone: userData.timezone || DEFAULT_TIMEZONE,
});

async function readJson<T>(response: Response): Promise<T | null> {
  return response.json().catch(() => null) as Promise<T | null>;
}

export const ProfileForm = ({ userData: initialUserData }: ProfileFormProps) => {
  const { message } = App.useApp();
  const { update } = useSession();
  const [profileForm] = Form.useForm<ProfileFormValues>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();
  const [userData, setUserData] = useState(initialUserData);
  const [formValues, setFormValues] = useState<ProfileFormValues>(
    toProfileFormValues(initialUserData)
  );
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const initialValues = useMemo(() => toProfileFormValues(userData), [userData]);
  const normalizedCurrent = useMemo(() => normalizeProfileValues(initialValues), [initialValues]);
  const normalizedDraft = useMemo(() => normalizeProfileValues(formValues), [formValues]);
  const hasProfileChanges = useMemo(
    () =>
      normalizedDraft.name !== normalizedCurrent.name ||
      normalizedDraft.lastName !== normalizedCurrent.lastName ||
      normalizedDraft.gender !== normalizedCurrent.gender ||
      normalizedDraft.timezone !== normalizedCurrent.timezone,
    [normalizedCurrent, normalizedDraft]
  );

  const timezoneOptions = useMemo(() => {
    try {
      const timeZones = Intl.supportedValuesOf("timeZone");
      const date = new Date();

      return timeZones.map((timezone) => {
        try {
          const gmt =
            new Intl.DateTimeFormat("en-US", {
              timeZone: timezone,
              timeZoneName: "longOffset",
            })
              .formatToParts(date)
              .find((part) => part.type === "timeZoneName")?.value ?? "";

          return { value: timezone, label: `${timezone} (${gmt})` };
        } catch {
          return { value: timezone, label: timezone };
        }
      });
    } catch {
      return [
        { value: DEFAULT_TIMEZONE, label: "Europe/Moscow (GMT+3)" },
        { value: "UTC", label: "UTC (GMT+0)" },
      ];
    }
  }, []);

  useEffect(() => {
    profileForm.setFieldsValue(initialValues);
    setFormValues(initialValues);
  }, [initialValues, profileForm]);

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
        message.error("Не удалось обновить данные профиля");
        return;
      }

      const updatedUser = {
        ...data.user,
        id: String(data.user.id),
        lastName: data.user.lastName ?? "",
      };

      setUserData(updatedUser);
      await update();
      message.success("Данные профиля обновлены");
    } catch {
      message.error("Произошла ошибка при обновлении данных");
    } finally {
      setSavingProfile(false);
    }
  };

  const openPasswordModal = () => {
    passwordForm.resetFields();
    setPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    setPasswordModalOpen(false);
    passwordForm.resetFields();
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
            errors: ["Неверный текущий пароль"],
          },
        ]);
        return;
      }

      if (!response.ok || !data?.success) {
        message.error("Не удалось изменить пароль");
        return;
      }

      message.success("Пароль успешно изменен");
      closePasswordModal();
    } catch {
      message.error("Произошла ошибка при изменении пароля");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <main className={styles.profile}>
      <Card className={styles.panel}>
        <PageHeader
          title="Профиль"
          actions={
            <Link href="/dashboard">
              <BackButton />
            </Link>
          }
        />

        <Form<ProfileFormValues>
          form={profileForm}
          initialValues={initialValues}
          size="large"
          className={styles.form}
          layout="vertical"
          onValuesChange={handleProfileValuesChange}
        >
          <Form.Item label="Email">
            <Input value={userData.email} disabled />
          </Form.Item>
          <Form.Item
            label="Имя"
            name="name"
            rules={[
              { required: true, whitespace: true, message: "Имя обязательно для заполнения" },
              { max: 255, message: "Слишком длинное имя" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Фамилия" name="lastName" rules={[{ max: 255 }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Пол" name="gender" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "male", label: "Мужской" },
                { value: "female", label: "Женский" },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="Часовой пояс"
            name="timezone"
            rules={[{ required: true, message: "Выберите часовой пояс" }]}
          >
            <Select showSearch suffixIcon={<GlobalOutlined />} options={timezoneOptions} />
          </Form.Item>
          <div className={styles.actions}>
            <Button
              type="primary"
              disabled={!hasProfileChanges}
              loading={savingProfile}
              onClick={handleSaveProfile}
            >
              Сохранить
            </Button>
            <Button onClick={openPasswordModal}>Изменить пароль</Button>
          </div>
        </Form>
      </Card>

      <Modal
        title="Изменение пароля"
        open={passwordModalOpen}
        onCancel={closePasswordModal}
        confirmLoading={savingPassword}
        onOk={handleChangePassword}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form<PasswordFormValues> layout="vertical" form={passwordForm}>
          <Form.Item
            label="Текущий пароль"
            name="currentPassword"
            rules={[{ required: true, message: "Введите текущий пароль" }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item
            label="Новый пароль"
            name="newPassword"
            rules={[
              { required: true, message: "Введите новый пароль" },
              { min: 6, message: "Минимум 6 символов" },
              { max: 128, message: "Слишком длинный пароль" },
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            label="Повторите пароль"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Повторите новый пароль" },
              { min: 6, message: "Минимум 6 символов" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Пароли не совпадают"));
                },
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        </Form>
      </Modal>
    </main>
  );
};
