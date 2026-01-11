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
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('');
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
      // password: userData.password,
      name: userData.name,
    });
  }, [userData]);

  const handleCloseModal = async () => {
    try {
      const userDataFromApi = await changePassword();
      if (!userDataFromApi.success) {
        console.log('Ошибка изменения пароля');
      } else {
        console.log('Пароль изменен');
      }
    } catch (error) {
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
      console.log(userDataFromApi);
      if (!userDataFromApi.success) {
        console.log(1231232131);
      } else {
        setFormData1(userDataFromApi);
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.log(2);
      console.log(`Ошибка: ${error}`);
    }
  };

  const checkPassword = async () => {
    const response = await fetch('/api/checkPassword', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
    const response = await fetch('/api/changePassword', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
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
            <Form.Item label='Введите новый пароль' name='newPassword'>
              <Input onChange={(e) => setNewPasswordValue(e.target.value)} />
            </Form.Item>
            <Form.Item label='Повторите пароль' name='confirmPassword'>
              <Input onChange={(e) => setConfirmPasswordValue(e.target.value)} />
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

// import { BackButton } from '@/components/BackButton/BackButton';
// import { Button, Form, Input, Modal, Steps, Typography, message } from 'antd';
// import Link from 'next/link';
// import { useEffect, useState } from 'react';
// import styles from './ProfileForm.module.scss';

// export const ProfileForm = ({ userData }: any) => {
//   const [form] = Form.useForm();
//   const [showModal, setShowModal] = useState(false);
//   const [currentStep, setCurrentStep] = useState(0);
//   const [inputPasswordValue, setInputPasswordValue] = useState('');
//   const [newPasswordValue, setNewPasswordValue] = useState('');
//   const [confirmPasswordValue, setConfirmPasswordValue] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const steps = ['Текущий пароль', 'Новый пароль'];

//   const showModalPassword = () => {
//     setShowModal(true);
//     setCurrentStep(0);
//     setInputPasswordValue('');
//     setNewPasswordValue('');
//     setConfirmPasswordValue('');
//   };

//   const closedModalPassword = () => {
//     setShowModal(false);
//     resetForm();
//   };

//   useEffect(() => {
//     form.setFieldsValue({
//       email: userData.email,
//       name: userData.name,
//     });
//   }, [userData]);

//   const resetForm = () => {
//     setCurrentStep(0);
//     setInputPasswordValue('');
//     setNewPasswordValue('');
//     setConfirmPasswordValue('');
//     setIsSubmitting(false);
//   };

//   const handleCloseModal = () => {
//     setShowModal(false);
//     resetForm();
//   };

//   const handleNextForm = async () => {
//     if (!inputPasswordValue.trim()) {
//       message.error('Введите текущий пароль');
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       const userDataFromApi = await checkPassword();

//       if (!userDataFromApi.success) {
//         message.error('Неверный текущий пароль');
//       } else {
//         setCurrentStep(currentStep + 1);
//         message.success('Текущий пароль подтверждён');
//       }
//     } catch (error) {
//       console.error('Ошибка при проверке пароля:', error);
//       message.error('Ошибка при проверке пароля');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const checkPassword = async () => {
//     const response = await fetch('/api/checkPassword', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         userId: userData.id,
//         password: inputPasswordValue,
//       }),
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     return await response.json();
//   };

//   const handleChangePassword = async () => {
//     // Проверка паролей на клиенте
//     if (!newPasswordValue.trim()) {
//       message.error('Введите новый пароль');
//       return;
//     }

//     if (newPasswordValue.length < 6) {
//       message.error('Пароль должен содержать минимум 6 символов');
//       return;
//     }

//     if (newPasswordValue !== confirmPasswordValue) {
//       message.error('Пароли не совпадают');
//       return;
//     }

//     if (newPasswordValue === inputPasswordValue) {
//       message.error('Новый пароль должен отличаться от текущего');
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       const result = await changePassword();

//       if (result.success) {
//         message.success('Пароль успешно изменён');
//         handleCloseModal();
//       } else {
//         message.error(result.error || 'Ошибка при изменении пароля');
//       }
//     } catch (error) {
//       console.error('Ошибка при изменении пароля:', error);
//       message.error('Ошибка при изменении пароля');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const changePassword = async () => {
//     const response = await fetch(`/api/checkPassword`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         currentPassword: inputPasswordValue,
//         newPassword: newPasswordValue,
//         confirmPassword: confirmPasswordValue,
//       }),
//     });

//     const data = await response;
//     console.log(data);

//     if (!response.ok) {
//       // Обработка ошибок валидации
//       if (response.status === 400 && data.details) {
//         const errorMessages = data.details.map((err: any) => err.message).join(', ');
//         throw new Error(errorMessages);
//       }
//       throw new Error(data.error || 'Ошибка при изменении пароля');
//     }

//     return data;
//   };

//   const footerModalPassword = () => {
//     switch (currentStep) {
//       case 0:
//         return (
//           <>
//             <Button onClick={closedModalPassword} disabled={isSubmitting}>
//               Отмена
//             </Button>
//             <Button
//               onClick={handleNextForm}
//               type='primary'
//               loading={isSubmitting}
//               disabled={!inputPasswordValue.trim()}>
//               Далее
//             </Button>
//           </>
//         );
//       case 1:
//         return (
//           <>
//             <Button onClick={() => setCurrentStep(0)} disabled={isSubmitting}>
//               Назад
//             </Button>
//             <Button onClick={closedModalPassword} disabled={isSubmitting}>
//               Отмена
//             </Button>
//             <Button
//               onClick={handleChangePassword}
//               type='primary'
//               loading={isSubmitting}
//               disabled={!newPasswordValue.trim() || !confirmPasswordValue.trim()}>
//               Изменить пароль
//             </Button>
//           </>
//         );
//       default:
//         return null;
//     }
//   };

//   const renderForm = () => {
//     switch (currentStep) {
//       case 0:
//         return (
//           <Form layout='vertical'>
//             <Form.Item
//               label='Введите текущий пароль'
//               name='password'
//               validateStatus={inputPasswordValue && inputPasswordValue.length < 6 ? 'error' : ''}
//               help={
//                 inputPasswordValue && inputPasswordValue.length < 6 ? 'Минимум 6 символов' : ''
//               }>
//               <Input.Password
//                 value={inputPasswordValue}
//                 onChange={(e) => setInputPasswordValue(e.target.value)}
//                 placeholder='Введите текущий пароль'
//                 disabled={isSubmitting}
//               />
//             </Form.Item>
//           </Form>
//         );
//       case 1:
//         return (
//           <Form layout='vertical'>
//             <Form.Item
//               label='Введите новый пароль'
//               name='newPassword'
//               validateStatus={
//                 newPasswordValue && newPasswordValue.length < 6
//                   ? 'error'
//                   : newPasswordValue === inputPasswordValue
//                   ? 'error'
//                   : ''
//               }
//               help={
//                 newPasswordValue && newPasswordValue.length < 6
//                   ? 'Минимум 6 символов'
//                   : newPasswordValue === inputPasswordValue
//                   ? 'Новый пароль должен отличаться от текущего'
//                   : ''
//               }>
//               <Input.Password
//                 value={newPasswordValue}
//                 onChange={(e) => setNewPasswordValue(e.target.value)}
//                 placeholder='Минимум 6 символов'
//                 disabled={isSubmitting}
//               />
//             </Form.Item>
//             <Form.Item
//               label='Повторите пароль'
//               name='confirmPassword'
//               validateStatus={
//                 confirmPasswordValue && newPasswordValue !== confirmPasswordValue ? 'error' : ''
//               }
//               help={
//                 confirmPasswordValue && newPasswordValue !== confirmPasswordValue
//                   ? 'Пароли не совпадают'
//                   : ''
//               }>
//               <Input.Password
//                 value={confirmPasswordValue}
//                 onChange={(e) => setConfirmPasswordValue(e.target.value)}
//                 placeholder='Повторите новый пароль'
//                 disabled={isSubmitting}
//               />
//             </Form.Item>
//           </Form>
//         );
//       default:
//         return null;
//     }
//   };

//   return (
//     <>
//       <div className={styles.title}>
//         <Typography.Title>Профиль</Typography.Title>
//         <Link href='/dashboard'>
//           <BackButton />
//         </Link>
//       </div>

//       <Form
//         form={form}
//         initialValues={{
//           email: userData.email,
//           name: userData.name,
//         }}
//         size='large'
//         className={styles.form}
//         layout='vertical'>
//         <Form.Item label='Email' name='email'>
//           <Input disabled />
//         </Form.Item>
//         <Form.Item label='Имя' name='name'>
//           <Input />
//         </Form.Item>
//         <Button type='primary'>Сохранить</Button>
//         <Button onClick={showModalPassword} style={{ marginLeft: 8 }}>
//           Изменить пароль
//         </Button>
//       </Form>

//       <Modal
//         footer={footerModalPassword}
//         title='Изменение пароля'
//         open={showModal}
//         onCancel={closedModalPassword}
//         closable={!isSubmitting}
//         maskClosable={!isSubmitting}>
//         <Steps
//           current={currentStep}
//           items={steps.map((item) => ({ title: item }))}
//           style={{ marginBottom: 24 }}
//         />
//         {renderForm()}
//       </Modal>
//     </>
//   );
// };

// import { BackButton } from '@/components/BackButton/BackButton';
// import { Button, Form, Input, Modal, Steps, Typography, App } from 'antd'; // Используем App вместо message напрямую
// import Link from 'next/link';
// import { useEffect, useState } from 'react';
// import styles from './ProfileForm.module.scss';

// export const ProfileForm = ({ userData }: any) => {
//   const [form] = Form.useForm();
//   const [showModal, setShowModal] = useState(false);
//   const [currentStep, setCurrentStep] = useState(0);
//   const [inputPasswordValue, setInputPasswordValue] = useState('');
//   const [newPasswordValue, setNewPasswordValue] = useState('');
//   const [confirmPasswordValue, setConfirmPasswordValue] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Используем App.useApp() для корректной работы с сообщениями
//   const { message } = App.useApp();

//   const steps = ['Текущий пароль', 'Новый пароль'];

//   const showModalPassword = () => {
//     setShowModal(true);
//     setCurrentStep(0);
//     setInputPasswordValue('');
//     setNewPasswordValue('');
//     setConfirmPasswordValue('');
//   };

//   const closedModalPassword = () => {
//     setShowModal(false);
//     resetForm();
//   };

//   useEffect(() => {
//     form.setFieldsValue({
//       email: userData.email,
//       name: userData.name,
//     });
//   }, [userData]);

//   const resetForm = () => {
//     setCurrentStep(0);
//     setInputPasswordValue('');
//     setNewPasswordValue('');
//     setConfirmPasswordValue('');
//     setIsSubmitting(false);
//   };

//   const handleCloseModal = () => {
//     setShowModal(false);
//     resetForm();
//   };

//   const handleNextForm = async () => {
//     if (!inputPasswordValue.trim()) {
//       message.error('Введите текущий пароль');
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       const userDataFromApi = await checkPassword();

//       if (!userDataFromApi.success) {
//         message.error('Неверный текущий пароль');
//       } else {
//         setCurrentStep(currentStep + 1);
//         message.success('Текущий пароль подтверждён');
//       }
//     } catch (error) {
//       console.error('Ошибка при проверке пароля:', error);
//       message.error('Ошибка при проверке пароля');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const checkPassword = async () => {
//     const response = await fetch('/api/checkPassword', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         userId: userData.id,
//         password: inputPasswordValue,
//       }),
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     return await response.json();
//   };

//   const handleChangePassword = async () => {
//     // Проверка паролей на клиенте
//     if (!newPasswordValue.trim()) {
//       message.error('Введите новый пароль');
//       return;
//     }

//     if (newPasswordValue.length < 6) {
//       message.error('Пароль должен содержать минимум 6 символов');
//       return;
//     }

//     if (newPasswordValue !== confirmPasswordValue) {
//       message.error('Пароли не совпадают');
//       return;
//     }

//     if (newPasswordValue === inputPasswordValue) {
//       message.error('Новый пароль должен отличаться от текущего');
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       const result = await changePassword();

//       if (result.success) {
//         message.success('Пароль успешно изменён');
//         handleCloseModal();
//       } else {
//         message.error(result.error || 'Ошибка при изменении пароля');
//       }
//     } catch (error: any) {
//       console.error('Ошибка при изменении пароля:', error);
//       message.error(error.message || 'Ошибка при изменении пароля');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const changePassword = async () => {
//     try {
//       console.log('Отправляю запрос на изменение пароля...');
//       console.log('userId:', userData.id);

//       const requestBody = {
//         userId: userData.id, // ОБЯЗАТЕЛЬНО добавляем userId
//         currentPassword: inputPasswordValue,
//         newPassword: newPasswordValue,
//         confirmPassword: confirmPasswordValue,
//       };

//       console.log('Тело запроса:', requestBody);

//       const response = await fetch('/api/checkPassword', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(requestBody),
//       });

//       console.log('Статус ответа:', response.status);
//       console.log('Статус текст:', response.statusText);

//       // Сначала получаем текст ответа
//       const responseText = await response.text();
//       console.log('Текст ответа:', responseText);

//       // Если ответ пустой
//       if (!responseText) {
//         if (response.ok) {
//           return { success: true, message: 'Пароль успешно изменён' };
//         }
//         throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
//       }

//       // Парсим JSON
//       let data;
//       try {
//         data = JSON.parse(responseText);
//         console.log('Парсированный JSON:', data);
//       } catch (error) {
//         console.error('Ошибка парсинга JSON:', error);
//         throw new Error('Сервер вернул некорректный ответ');
//       }

//       if (!response.ok) {
//         console.error('Ошибка от сервера:', data);
//         if (response.status === 400 && data.details) {
//           const errorMessages = data.details.map((err: any) => err.message).join(', ');
//           throw new Error(errorMessages);
//         }
//         throw new Error(data.error || 'Ошибка при изменении пароля');
//       }

//       console.log('Успешный ответ:', data);
//       return data;
//     } catch (error) {
//       console.error('Общая ошибка в changePassword:', error);
//       throw error;
//     }
//   };

//   const footerModalPassword = () => {
//     switch (currentStep) {
//       case 0:
//         return (
//           <>
//             <Button onClick={closedModalPassword} disabled={isSubmitting}>
//               Отмена
//             </Button>
//             <Button
//               onClick={handleNextForm}
//               type='primary'
//               loading={isSubmitting}
//               disabled={!inputPasswordValue.trim()}>
//               Далее
//             </Button>
//           </>
//         );
//       case 1:
//         return (
//           <>
//             <Button onClick={() => setCurrentStep(0)} disabled={isSubmitting}>
//               Назад
//             </Button>
//             <Button onClick={closedModalPassword} disabled={isSubmitting}>
//               Отмена
//             </Button>
//             <Button
//               onClick={handleChangePassword}
//               type='primary'
//               loading={isSubmitting}
//               disabled={!newPasswordValue.trim() || !confirmPasswordValue.trim()}>
//               Изменить пароль
//             </Button>
//           </>
//         );
//       default:
//         return null;
//     }
//   };

//   const renderForm = () => {
//     switch (currentStep) {
//       case 0:
//         return (
//           <Form layout='vertical'>
//             <Form.Item
//               label='Введите текущий пароль'
//               name='password'
//               validateStatus={inputPasswordValue && inputPasswordValue.length < 6 ? 'error' : ''}
//               help={
//                 inputPasswordValue && inputPasswordValue.length < 6 ? 'Минимум 6 символов' : ''
//               }>
//               <Input.Password
//                 value={inputPasswordValue}
//                 onChange={(e) => setInputPasswordValue(e.target.value)}
//                 placeholder='Введите текущий пароль'
//                 disabled={isSubmitting}
//               />
//             </Form.Item>
//           </Form>
//         );
//       case 1:
//         return (
//           <Form layout='vertical'>
//             <Form.Item
//               label='Введите новый пароль'
//               name='newPassword'
//               validateStatus={
//                 newPasswordValue && newPasswordValue.length < 6
//                   ? 'error'
//                   : newPasswordValue === inputPasswordValue
//                   ? 'error'
//                   : ''
//               }
//               help={
//                 newPasswordValue && newPasswordValue.length < 6
//                   ? 'Минимум 6 символов'
//                   : newPasswordValue === inputPasswordValue
//                   ? 'Новый пароль должен отличаться от текущего'
//                   : ''
//               }>
//               <Input.Password
//                 value={newPasswordValue}
//                 onChange={(e) => setNewPasswordValue(e.target.value)}
//                 placeholder='Минимум 6 символов'
//                 disabled={isSubmitting}
//               />
//             </Form.Item>
//             <Form.Item
//               label='Повторите пароль'
//               name='confirmPassword'
//               validateStatus={
//                 confirmPasswordValue && newPasswordValue !== confirmPasswordValue ? 'error' : ''
//               }
//               help={
//                 confirmPasswordValue && newPasswordValue !== confirmPasswordValue
//                   ? 'Пароли не совпадают'
//                   : ''
//               }>
//               <Input.Password
//                 value={confirmPasswordValue}
//                 onChange={(e) => setConfirmPasswordValue(e.target.value)}
//                 placeholder='Повторите новый пароль'
//                 disabled={isSubmitting}
//               />
//             </Form.Item>
//           </Form>
//         );
//       default:
//         return null;
//     }
//   };

//   return (
//     <>
//       <div className={styles.title}>
//         <Typography.Title>Профиль</Typography.Title>
//         <Link href='/dashboard'>
//           <BackButton />
//         </Link>
//       </div>

//       <Form
//         form={form}
//         initialValues={{
//           email: userData.email,
//           name: userData.name,
//         }}
//         size='large'
//         className={styles.form}
//         layout='vertical'>
//         <Form.Item label='Email' name='email'>
//           <Input disabled />
//         </Form.Item>
//         <Form.Item label='Имя' name='name'>
//           <Input />
//         </Form.Item>
//         <Button type='primary'>Сохранить</Button>
//         <Button onClick={showModalPassword} style={{ marginLeft: 8 }}>
//           Изменить пароль
//         </Button>
//       </Form>

//       <Modal
//         footer={footerModalPassword}
//         title='Изменение пароля'
//         open={showModal}
//         onCancel={closedModalPassword}
//         closable={!isSubmitting}
//         maskClosable={!isSubmitting}>
//         <Steps
//           current={currentStep}
//           items={steps.map((item) => ({ title: item }))}
//           style={{ marginBottom: 24 }}
//         />
//         {renderForm()}
//       </Modal>
//     </>
//   );
// };
