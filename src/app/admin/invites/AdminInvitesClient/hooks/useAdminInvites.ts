"use client";

import { Form } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import { useCallback, useMemo, useState } from "react";
import { ADMIN_INVITES_LABELS } from "../constants/adminInvitesConstants";
import type { AdminInviteRow, InviteFormValues } from "../types/adminInvitesTypes";
import {
  buildInviteUrl,
  getApiErrorMessage,
  getCreatedInviteData,
} from "../utils/adminInvitesUtils";

type UseAdminInvitesParams = {
  invites: AdminInviteRow[];
  messageApi: MessageInstance;
};

export const useAdminInvites = ({ invites, messageApi }: UseAdminInvitesParams) => {
  const [form] = Form.useForm<InviteFormValues>();
  const [rows, setRows] = useState<AdminInviteRow[]>(invites);
  const [creating, setCreating] = useState(false);
  const [tokenById, setTokenById] = useState<Record<number, string>>({});
  const [lastCreatedId, setLastCreatedId] = useState<number | null>(null);

  const lastInviteUrl = useMemo(() => {
    if (lastCreatedId === null) {
      return "";
    }

    const token = tokenById[lastCreatedId];
    if (!token) {
      return "";
    }

    return buildInviteUrl(token);
  }, [lastCreatedId, tokenById]);

  const handleCopy = useCallback(
    async (value: string) => {
      try {
        if (!value) {
          messageApi.error(ADMIN_INVITES_LABELS.linkUnavailable);
          return;
        }

        if (!navigator.clipboard) {
          throw new Error("clipboard-not-available");
        }

        await navigator.clipboard.writeText(value);
        messageApi.success(ADMIN_INVITES_LABELS.copiedOk);
      } catch {
        messageApi.error(ADMIN_INVITES_LABELS.copyFail);
      }
    },
    [messageApi]
  );

  const handleCreate = async (values: InviteFormValues) => {
    setCreating(true);

    try {
      const response = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        messageApi.error(getApiErrorMessage(data, ADMIN_INVITES_LABELS.createFail));
        return;
      }

      const createdData = getCreatedInviteData(data);
      if (!createdData) {
        messageApi.error(ADMIN_INVITES_LABELS.createFail);
        return;
      }

      setRows((prev) => {
        const filtered = prev.filter((row) => row.id !== createdData.invite.id);
        return [createdData.invite, ...filtered];
      });
      setTokenById((prev) => ({ ...prev, [createdData.invite.id]: createdData.token }));
      setLastCreatedId(createdData.invite.id);
      form.resetFields();
      messageApi.success(ADMIN_INVITES_LABELS.createOk);
    } catch {
      messageApi.error(ADMIN_INVITES_LABELS.createFail);
    } finally {
      setCreating(false);
    }
  };

  return {
    form,
    rows,
    creating,
    tokenById,
    lastInviteUrl,
    handleCopy,
    handleCreate,
  };
};
