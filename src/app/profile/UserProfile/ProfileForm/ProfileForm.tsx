import { BackButton } from '@/components/BackButton/BackButton';
import { Button, Form, Input, Modal, Steps, Typography } from 'antd';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './ProfileForm.module.scss';
import bcrypt from 'bcryptjs';

export const ProfileForm = ({ userData }: any) => {
  const [form] = Form.useForm();
  // const [openChangePassword, setOpenChangePassword] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [openNewPassword, setOpenNewPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData1, setFormData1] = useState({});
  const [inputPasswordValue, setInputPasswordValue] = useState('');
  const [formData2, setFormData2] = useState({});

  const steps = ['Текущий пароль', 'Новый пароль'];

  const showModalPassword = () => {
    setShowModal(true);
    setCurrentStep(0);
  };

  const closedModalPassword = () => {
    setShowModal(false);
  };

  useEffect(() => {
    form.setFieldsValue({
      email: userData.email,
      password: userData.password,
      name: userData.name,
    });
  }, [userData]);

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentStep(0);
    setFormData1({});
    setFormData2({});
  };

  const handleNextForm = async () => {
    try {
      const userData = await getUser();
      setFormData1(userData);
      const passwordHash = await hashPassword(inputPasswordValue);
      if (passwordHash === userData.password) {
        return console.log('XASHHH');
      } else {
        console.log(passwordHash);
        console.log(userData.password);
        console.log('werewewrew');
      }
    } catch (error) {
      console.log(`Ошибка: ${error}`);
    }

    setCurrentStep(currentStep + 1);
  };

  const getUser = async () => {
    const response = await fetch('/api/getUser', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    return {
      email: data.user.email,
      password: data.user.password,
      name: data.user.name,
    };
  };

  const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 10);
  };

  const footerModalPassword = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <Button onClick={closedModalPassword}>Отмена</Button>
            <Button onClick={handleNextForm}>Далее</Button>
          </>
        );
      case 1:
        return (
          <>
            <Button onClick={closedModalPassword}>Отмена</Button>
            <Button onClick={handleCloseModal}>Готово</Button>
          </>
        );
    }
  };

  const renderForm = () => {
    switch (currentStep) {
      case 0:
        return (
          <Form layout='vertical'>
            <Form.Item label='Введите текущий пароль' name='password'>
              <Input onChange={(e) => setInputPasswordValue(e.target.value)} />
            </Form.Item>
          </Form>
        );
      case 1:
        return (
          <Form layout='vertical'>
            <Form.Item label='Введите новый пароль' name='password'>
              <Input />
            </Form.Item>
            <Form.Item label='Повторите пароль' name='password'>
              <Input />
            </Form.Item>
          </Form>
        );
    }
  };

  return (
    <>
      <div className={styles.title}>
        <Typography.Title>Профиль</Typography.Title>
        <Link href='/dashboard'>
          <BackButton />
        </Link>
      </div>
      <Form
        form={form}
        initialValues={{
          Email: userData.email,
          name: userData.name,
        }}
        size='large'
        className={styles.form}
        layout='vertical'>
        <Form.Item label='email' name='email'>
          <Input />
        </Form.Item>
        <Form.Item label='Имя' name='name'>
          <Input />
        </Form.Item>
        <Button>Сохранить</Button>
        <Button onClick={showModalPassword}>Изменить пароль</Button>
      </Form>
      <Modal
        footer={footerModalPassword}
        title='Изменение пароля'
        open={showModal}
        onCancel={closedModalPassword}>
        {/* <Form layout='vertical'>
          <Form.Item label='Введите текущий пароль' name='password'>
            <Input />
          </Form.Item>
        </Form> */}
        {renderForm()}
      </Modal>
    </>
  );
};
