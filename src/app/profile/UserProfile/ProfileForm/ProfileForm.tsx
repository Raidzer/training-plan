import { BackButton } from "@/components/BackButton/BackButton";
import { Button, Form, Input, Modal, Select, Steps, Typography } from "antd";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./ProfileForm.module.scss";
import bcrypt from "bcryptjs";

export const ProfileForm = ({ userData }: any) => {
  const [form] = Form.useForm();
  const [modalForm] = Form.useForm();
  const [showModal, setShowModal] = useState(false);
  const [openNewPassword, setOpenNewPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData1, setFormData1] = useState({});
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
    gender: userData.gender,
    email: userData.email,
  });
  const steps = ["Текущий пароль", "Новый пароль"];

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
    // modalForm.setFields([
    //   { name: "password", errors: [] },
    //   { name: "newPassword", errors: [] },
    //   { name: "confirmPassword", errors: [] },
    // ]);
    modalForm.setFieldsValue({
      password: "",
      newPassword: "",
      confirmPassword: "",
    });
    modalForm.resetFields();
  };

  const handleFormValuesChange = (allValues: any) => {
    setFormValues(allValues);

    // Проверяем, изменились ли поля name или gender
    const isNameChanged = allValues.name !== userData.name;
    const isGenderChanged = allValues.gender !== userData.gender;

    if (allValues.name === "") {
      setIsChangeDataUser(true);
      return;
    }
    setIsChangeDataUser(!(isNameChanged || isGenderChanged));
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
      gender: userData.gender,
    });
  }, [userData]);

  const handleFinishModal = async () => {
    if (newPasswordValue !== confirmPasswordValue) {
      setPasswordsMatchError("Пароли не совпадают");
      return;
    }
    try {
      const userDataFromApi = await changePassword();
      if (!userDataFromApi.success) {
        setNewPasswordError("Ошибка изменения пароля");
        console.log("Ошибка изменения пароля");
      } else {
        console.log("Пароль изменен");
        setNewPasswordError("");
      }
    } catch (error) {
      setNewPasswordError("Произошла ошибка при изменении пароля");
      console.log(`Ошибка: ${error}`);
    }

    setShowModal(false);
    setCurrentStep(0);
    // setFormData1({});
    // setFormData2({});
  };

  const handleNextForm = async () => {
    try {
      const userDataFromApi = await checkPassword();
      if (!userDataFromApi.success) {
        setPasswordError("Неверный пароль");
      } else {
        setFormData1(userDataFromApi);
        setCurrentStep(currentStep + 1);
        setPasswordError("");
      }
    } catch (error) {
      setPasswordError("Произошла ошибка при проверке пароля");
      console.log(`Ошибка: ${error}`);
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
    const response = await fetch("/api/changePassword", {
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
          gender: userData.gender,
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
        <Form.Item label="Пол" name="gender">
          <Select>
            <Select.Option value="male">Мужской</Select.Option>
            <Select.Option value="female">Женский</Select.Option>
          </Select>
        </Form.Item>
        <Button disabled={isChangeDataUser}>Сохранить</Button>
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
