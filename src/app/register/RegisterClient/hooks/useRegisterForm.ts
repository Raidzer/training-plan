"use client";

import { useMemo, useRef, useState } from "react";
import type { FormProps } from "antd";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { buildTimezoneOptions } from "@/shared/constants/timezones";
import { getInternalAuthRedirect } from "@/shared/utils/authRedirect";
import { REGISTER_TEXT } from "../constants/registerConstants";
import type {
  RegisterApiResponse,
  RegisterFields,
  RegisterMessageApi,
} from "../types/registerTypes";
import { getRegisterErrorMessage, normalizeRegisterPayload } from "../utils/registerUtils";

export const useRegisterForm = (messageApi: RegisterMessageApi) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
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

    if (submittingRef.current) {
      return;
    }

    const payload = normalizeRegisterPayload(values);
    submittingRef.current = true;
    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, inviteToken }),
      });

      const data = (await response.json().catch(() => null)) as RegisterApiResponse | null;

      if (!response.ok) {
        messageApi.error(getRegisterErrorMessage(data?.error));
        return;
      }

      messageApi.success(REGISTER_TEXT.registerSuccess);

      const loginResponse = await signIn("credentials", {
        redirect: false,
        email: payload.email,
        password: payload.password,
        callbackUrl: "/dashboard",
      });

      if (!loginResponse || loginResponse.error || loginResponse.ok === false) {
        messageApi.warning(REGISTER_TEXT.autoLoginFailed);
        router.push("/login");
        return;
      }

      router.push(getInternalAuthRedirect(loginResponse.url));
    } catch (error) {
      messageApi.error(REGISTER_TEXT.requestError);
      console.error(error);
    } finally {
      submittingRef.current = false;
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
