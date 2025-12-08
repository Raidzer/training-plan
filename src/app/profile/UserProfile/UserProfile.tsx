'use client';
import styles from './UserProfile.module.scss';
import { BackButton } from '@/components/BackButton/BackButton';
import { Form, Input, Typography } from 'antd';
import Link from 'next/link';
import React from 'react';

export const UserProfile = () => {
  const [email, setEmail] = React.useState('sadsadsa');
  const [password, setPassword] = React.useState('fghfghfg');

  return (
    <>
      <div className={styles.title}>
        <Typography.Title>Профиль</Typography.Title>
        <Link href='/dashboard'>
          <BackButton />
        </Link>
      </div>
      <Form size='large' className={styles.form} layout='vertical'>
        <Form.Item initialValue={`${email}`} label='Email' name='Email'>
          <Input />
        </Form.Item>
        <Form.Item initialValue={`${password}`} label='Пароль' name='password'>
          <Input />
        </Form.Item>
      </Form>
    </>
  );
};
