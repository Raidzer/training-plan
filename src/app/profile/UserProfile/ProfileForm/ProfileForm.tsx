import { BackButton } from "@/components/BackButton/BackButton";
import { Button, Form, Input, Modal, Select, Steps, Typography, message } from "antd";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./ProfileForm.module.scss";
import { GlobalOutlined } from "@ant-design/icons";

export const ProfileForm = ({ userData }: any) => {
  const [form] = Form.useForm();
  const [modalForm] = Form.useForm();
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [inputPasswordValue, setInputPasswordValue] = useState("");
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [confirmPasswordValue, setConfirmPasswordValue] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [passwordsMatchError, setPasswordsMatchError] = useState("");
  const [isChangeDataUser, setIsChangeDataUser] = useState(true);
  const [formValues, setFormValues] = useState({
    name: userData.name,
    lastName: userData.lastName,
    gender: userData.gender,
    email: userData.email,
    timezone: userData.timezone,
  });

  const showModalPassword = () => {
    setShowModal(true);
    setCurrentStep(0);
    setPasswordError("");
    setNewPasswordError("");
    setConfirmPasswordError("");
    setPasswordsMatchError("");
    setInputPasswordValue("");
    setNewPasswordValue("");
    setConfirmPasswordValue("");

    modalForm.resetFields();
  };

  const closedModalPassword = () => {
    setShowModal(false);
    setPasswordError("");
    setInputPasswordValue("");
    setPasswordsMatchError("");
    setConfirmPasswordError("");
    setPasswordsMatchError("");
    setNewPasswordError("");
    modalForm.setFieldsValue({
      password: "",
      newPassword: "",
      confirmPassword: "",
    });
    modalForm.resetFields();
  };

  const handleFormValuesChange = (changedValues: any, allValues: any) => {
    setFormValues(allValues);

    const isNameChanged = allValues.name !== userData.name;
    const isLastNameChanged = allValues.lastName !== userData.lastName;
    const isGenderChanged = allValues.gender !== userData.gender;
    const isTimezoneChange = allValues.timezone !== userData.timezone;

    if (allValues.name === "") {
      setIsChangeDataUser(true);
      return;
    }
    setIsChangeDataUser(
      !(isNameChanged || isGenderChanged || isTimezoneChange || isLastNameChanged)
    );
  };

  const isFormValid = () => {
    return (
      !newPasswordError &&
      !confirmPasswordError &&
      !passwordsMatchError &&
      newPasswordValue.length >= 6 &&
      confirmPasswordValue.length >= 6
    );
  };

  useEffect(() => {
    form.setFieldsValue({
      email: userData.email,
      name: userData.name,
      lastName: userData.lastName,
      gender: userData.gender,
    });
  }, [userData]);

  const showMessage = (type: "success" | "error" | "info" | "warning", content: string) => {
    message[type](content);
  };

  const handleFinishModal = async () => {
    if (newPasswordValue !== confirmPasswordValue) {
      setPasswordsMatchError("Пароли не совпадают");
      showMessage("error", "Пароли не совпадают");
      return;
    }
    try {
      const userDataFromApi = await changePassword();
      if (!userDataFromApi.success) {
        setNewPasswordError("Ошибка изменения пароля");
        showMessage("error", "Не удалось изменить пароль. Попробуйте еще раз.");
      } else {
        setNewPasswordError("");
        showMessage("success", "Пароль успешно изменен!");
      }
    } catch (error) {
      setNewPasswordError("Произошла ошибка при изменении пароля");
      showMessage("error", "Произошла ошибка при изменении пароля");
    }
    setShowModal(false);
    setCurrentStep(0);
  };

  const handleNextForm = async () => {
    try {
      const userDataFromApi = await checkPassword();
      if (!userDataFromApi.success) {
        setPasswordError("Неверный пароль");
        showMessage("error", "Неверный пароль");
      } else {
        setCurrentStep(currentStep + 1);
        setPasswordError("");
        showMessage("success", "Пароль подтвержден");
      }
    } catch (error) {
      setPasswordError("Произошла ошибка при проверке пароля");
      showMessage("error", "Произошла ошибка при проверке пароля");
    }
  };

  const checkPassword = async () => {
    const response = await fetch("/api/checkPassword", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userData.id,
        password: inputPasswordValue,
      }),
    });
    const data = await response.json();
    return data;
  };

  const changePassword = async () => {
    const response = await fetch("/api/setUserPassword", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userData.id,
        newPassword: newPasswordValue,
        confirmPassword: confirmPasswordValue,
      }),
    });
    const data = await response.json();
    return data;
  };

  const changeDataUser = async () => {
    try {
      const response = await fetch("/api/setDataUser", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userData.id,
          name: formValues.name,
          lastName: formValues.lastName,
          gender: formValues.gender,
          timezone: formValues.timezone,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setIsChangeDataUser(true);
        showMessage("success", "Данные профиля обновлены!");
      } else {
        showMessage("error", data.message || "Не удалось обновить данные профиля");
      }
      return data;
    } catch (error) {
      showMessage("error", "Произошла ошибка при обновлении данных");
    }
  };

  const footerModalPassword = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <Button onClick={closedModalPassword}>Отмена</Button>
            <Button
              onClick={handleNextForm}
              type="primary"
              disabled={!inputPasswordValue.trim() || inputPasswordValue.length < 6}
            >
              Далее
            </Button>
          </>
        );
      case 1:
        return (
          <>
            <Button onClick={closedModalPassword}>Отмена</Button>
            <Button onClick={handleFinishModal} type="primary" disabled={!isFormValid()}>
              Готово
            </Button>
          </>
        );
    }
  };

  const renderFormPassword = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <Form.Item
              label="Введите текущий пароль"
              name="password"
              validateStatus={
                passwordError || (inputPasswordValue && inputPasswordValue.length < 6)
                  ? "error"
                  : ""
              }
              help={
                passwordError ||
                (inputPasswordValue && inputPasswordValue.length < 6 ? "Минимум 6 символов" : "")
              }
            >
              <Input
                value={inputPasswordValue}
                onChange={(e) => {
                  setInputPasswordValue(e.target.value);
                  modalForm.setFieldsValue({ password: e.target.value });
                }}
                onPressEnter={handleNextForm}
              />
            </Form.Item>
          </>
        );
      case 1:
        return (
          <>
            <Form.Item
              label="Введите новый пароль"
              name="newPassword"
              validateStatus={
                newPasswordError || (newPasswordValue && newPasswordValue.length < 6) ? "error" : ""
              }
              help={
                passwordError ||
                (newPasswordValue && newPasswordValue.length < 6 ? "Минимум 6 символов" : "")
              }
            >
              <Input onChange={(e) => setNewPasswordValue(e.target.value)} />
            </Form.Item>
            <Form.Item
              label="Повторите пароль"
              name="confirmPassword"
              validateStatus={
                confirmPasswordValue.length > 0
                  ? confirmPasswordValue.length < 6
                    ? "error"
                    : passwordsMatchError
                      ? "error"
                      : ""
                  : ""
              }
              help={
                confirmPasswordValue.length > 0
                  ? confirmPasswordValue.length < 6
                    ? "Минимум 6 символов"
                    : passwordsMatchError
                      ? "Пароли не совпадают"
                      : ""
                  : ""
              }
            >
              <Input
                onChange={(e) => {
                  const value = e.target.value;
                  setConfirmPasswordValue(value);
                  if (value.length >= 6) {
                    if (value !== newPasswordValue) {
                      setPasswordsMatchError("Пароли не совпадают");
                    } else {
                      setPasswordsMatchError("");
                    }
                  } else {
                    setPasswordsMatchError("");
                  }
                }}
              />
            </Form.Item>
          </>
        );
    }
  };

  const timezoneOptions = useMemo(() => {
    try {
      const timeZones = Intl.supportedValuesOf("timeZone");
      const formatter = new Intl.DateTimeFormat("ru-RU", {
        timeZoneName: "longOffset",
        hour12: false,
      });

      return timeZones.map((tz) => {
        try {
          const parts = formatter.formatToParts(new Date());
          const offsetPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "";

          const date = new Date();
          const gmt =
            new Intl.DateTimeFormat("en-US", {
              timeZone: tz,
              timeZoneName: "longOffset",
            })
              .formatToParts(date)
              .find((p) => p.type === "timeZoneName")?.value ?? "";

          return { value: tz, label: `${tz} (${gmt})` };
        } catch {
          return { value: tz, label: tz };
        }
      });
    } catch {
      return [
        { value: "Europe/Moscow", label: "Europe/Moscow (GMT+3)" },
        { value: "UTC", label: "UTC (GMT+0)" },
      ];
    }
  }, []);

  return (
    <>
      <div className={styles.title}>
        <Typography.Title>Профиль</Typography.Title>
        <Link href="/dashboard">
          <BackButton />
        </Link>
      </div>
      <Form
        form={form}
        initialValues={{
          Email: userData.email,
          name: userData.name,
          lastName: userData.lastName,
          gender: userData.gender,
          timezone: userData.timezone,
        }}
        size="large"
        className={styles.form}
        layout="vertical"
        onValuesChange={handleFormValuesChange}
      >
        <Form.Item label="email" name="email">
          <Input disabled />
        </Form.Item>
        <Form.Item label="Имя" name="name">
          <Input />
        </Form.Item>
        <Form.Item label="Фамилия" name="lastName">
          <Input />
        </Form.Item>
        <Form.Item label="Пол" name="gender">
          <Select>
            <Select.Option value="male">Мужской</Select.Option>
            <Select.Option value="female">Женский</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="Часовой пояс" name="timezone">
          <Select showSearch suffixIcon={<GlobalOutlined />} options={timezoneOptions}></Select>
        </Form.Item>
        <Button disabled={isChangeDataUser} onClick={() => changeDataUser()}>
          Сохранить
        </Button>
        <Button onClick={showModalPassword}>Изменить пароль</Button>
      </Form>
      <Modal
        footer={footerModalPassword}
        title="Изменение пароля"
        open={showModal}
        onCancel={closedModalPassword}
      >
        <Form layout="vertical" form={modalForm}>
          {renderFormPassword()}
        </Form>
      </Modal>
    </>
  );
};
