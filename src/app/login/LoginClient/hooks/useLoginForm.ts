"use client";

import { App } from "antd";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { getInternalAuthRedirect } from "@/shared/utils/authRedirect";
import { LOGIN_TEXT } from "../constants/loginConstants";
import type { LoginFields } from "../types/loginTypes";

export function useLoginForm() {
  const router = useRouter();
  const { message: messageApi } = App.useApp();
  const submissionLockRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onFinish = useCallback(
    async (values: LoginFields): Promise<void> => {
      if (submissionLockRef.current) {
        return;
      }

      submissionLockRef.current = true;
      setIsSubmitting(true);

      try {
        const response = await signIn("credentials", {
          email: values.email.trim(),
          password: values.password,
          redirect: false,
          callbackUrl: "/dashboard",
        });

        if (!response) {
          messageApi.error(LOGIN_TEXT.requestError);
          return;
        }

        if (response.error || response.ok === false) {
          messageApi.error(LOGIN_TEXT.invalidCredentials);
          return;
        }

        messageApi.success(LOGIN_TEXT.success);
        router.push(getInternalAuthRedirect(response.url));
      } catch {
        messageApi.error(LOGIN_TEXT.requestError);
      } finally {
        submissionLockRef.current = false;
        setIsSubmitting(false);
      }
    },
    [messageApi, router]
  );

  return {
    isSubmitting,
    onFinish,
  };
}
