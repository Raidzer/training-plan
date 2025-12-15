'use client';

import { Button, Card, Form, Input, Typography, message, type FormProps } from 'antd';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { LockOutlined, MailOutlined, UserOutlined, UserAddOutlined } from '@ant-design/icons';
import styles from './register.module.scss';

type RegisterFields = {
  name: string;
  email: string;
  password: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish: FormProps<RegisterFields>['onFinish'] = async (values) => {
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!res.ok) {
        messageApi.error(data?.error ?? 'Не удалось создать аккаунт');
        return;
      }

      messageApi.success('Аккаунт создан, входим...');

      const loginRes = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
        callbackUrl: '/dashboard',
      });

      if (loginRes?.error) {
        messageApi.warning('Регистрация успешна, но не удалось войти. Попробуйте войти вручную.');
        router.push('/login');
        return;
      }

      router.push(loginRes?.url ?? '/dashboard');
    } catch (err) {
      messageApi.error('Произошла ошибка. Попробуйте ещё раз.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      {contextHolder}
      <Card className={styles.card}>
        <Typography.Title level={3} className={styles.title}>
          Регистрация
        </Typography.Title>
        <Typography.Paragraph type='secondary' className={styles.subtitle}>
          Создайте новый аккаунт, чтобы получить доступ к панели и планам.
        </Typography.Paragraph>
        <Form<RegisterFields> layout='vertical' onFinish={onFinish} requiredMark={false}>
          <Form.Item name='name' label='Имя' rules={[{ required: true, message: 'Введите имя' }]}>
            <Input prefix={<UserOutlined />} placeholder='Иван Иванов' />
          </Form.Item>
          <Form.Item
            name='email'
            label='Email'
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Некорректный email' },
            ]}>
            <Input prefix={<MailOutlined />} placeholder='you@example.com' />
          </Form.Item>
          <Form.Item
            name='password'
            label='Пароль'
            rules={[
              { required: true, message: 'Введите пароль' },
              {
                min: 6,
                message: 'Минимум 6 символов',
              },
            ]}>
            <Input.Password prefix={<LockOutlined />} placeholder='••••••••' />
          </Form.Item>
          <Button
            type='primary'
            htmlType='submit'
            icon={<UserAddOutlined />}
            block
            loading={loading}>
            Зарегистрироваться
          </Button>
          <Typography.Paragraph type='secondary' className={styles.subtitle}>
            Уже есть аккаунт?{' '}
            <Link href='/login' passHref>
              Войти
            </Link>
          </Typography.Paragraph>
        </Form>
      </Card>
    </main>
  );
}
