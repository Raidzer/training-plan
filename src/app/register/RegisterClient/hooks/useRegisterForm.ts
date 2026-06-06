"use client";

import { useMemo, useState } from "react";
import type { FormProps } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { buildTimezoneOptions } from "@/shared/constants/timezones";
import { REGISTER_TEXT } from "../constants/registerConstants";
import type { RegisterApiResponse, RegisterFields } from "../types/registerTypes";

export const useRegisterForm = (messageApi: MessageInstance) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const inviteToken = (searchParams.get("invite") ?? "").trim();
  const hasInvite = inviteToken.length >= 10;

  const timezoneOptions = useMemo(() => {
    return buildTimezoneOptions();
  }, []);

  const onFinish: FormProps<RegisterFields>["onFinish"] = async (values) => {
    if (!hasInvite) {
      messageApi.error(REGISTER_TEXT.inviteRequired);
      return;
    }

    const payload = {
      name: values.name,
      lastName: values.lastName,
      gender: values.gender,
      login: values.login,
      email: values.email,
      password: values.password,
      timezone: values.timezone,
    };

    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, inviteToken }),
      });

      const data = (await response.json().catch(() => null)) as RegisterApiResponse | null;

      if (!response.ok) {
        const apiError = data?.error;

        if (apiError === "invite_invalid") {
          messageApi.error(REGISTER_TEXT.inviteInvalid);
          return;
        }

        if (apiError === "invite_used") {
          messageApi.error(REGISTER_TEXT.inviteUsed);
          return;
        }

        if (apiError === "invite_expired") {
          messageApi.error(REGISTER_TEXT.inviteExpired);
          return;
        }

        messageApi.error(data?.error ?? REGISTER_TEXT.registerFailed);
        return;
      }

      messageApi.success(REGISTER_TEXT.registerSuccess);

      const loginResponse = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
        callbackUrl: "/dashboard",
      });

      if (loginResponse?.error) {
        messageApi.warning(REGISTER_TEXT.autoLoginFailed);
        router.push("/login");
        return;
      }

      router.push(loginResponse?.url ?? "/dashboard");
    } catch (error) {
      messageApi.error(REGISTER_TEXT.requestError);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    hasInvite,
    timezoneOptions,
    onFinish,
  };
};
