import nodemailer from "nodemailer";

const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

const transporter = nodemailer.createTransport(smtpConfig);

const FROM_EMAIL = process.env.SMTP_FROM || '"Training Plan" <noreply@training-plan.com>';

export async function sendVerificationEmail(email: string, token: string) {
  const confirmLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: FROM_EMAIL,
    to: email,
    subject: "Подтверждение Email",
    html: `
      <h1>Подтверждение Email</h1>
      <p>Пожалуйста, перейдите по ссылке ниже, чтобы подтвердить ваш email адрес:</p>
      <a href="${confirmLink}">${confirmLink}</a>
      <p>Эта ссылка действительна в течение 24 часов.</p>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;

  await transporter.sendMail({
    from: FROM_EMAIL,
    to: email,
    subject: "Сброс пароля",
    html: `
      <h1>Сброс пароля</h1>
      <p>Мы получили запрос на сброс пароля для вашего аккаунта.</p>
      <p>Если вы этого не делали, просто проигнорируйте это письмо.</p>
      <p>Чтобы сбросить пароль, перейдите по ссылке:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Эта ссылка действительна в течение 1 часа.</p>
    `,
  });
}
