"use client";

import { Form } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ADMIN_INVITES_LABELS } from "../constants/adminInvitesConstants";
import { AdminInvitesApiError, createAdminInvite } from "../services/adminInvitesApi";
import type { AdminInviteRow, InviteFormValues } from "../types/adminInvitesTypes";
import {
  buildInviteUrl,
  getApiErrorMessage,
  getCreatedInviteData,
  getCurrentInviteStatus,
} from "../utils/adminInvitesUtils";

const EXPIRY_TIMER_BUFFER_MS = 50;
const MAX_TIMEOUT_DELAY_MS = 2_147_000_000;

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
  const creatingRef = useRef(false);

  useEffect(() => {
    const now = Date.now();
    let nearestExpiry = Number.POSITIVE_INFINITY;

    for (const row of rows) {
      if (row.status !== "active") {
        continue;
      }

      const expiresAt = Date.parse(row.expiresAt);
      if (Number.isNaN(expiresAt)) {
        continue;
      }

      nearestExpiry = Math.min(nearestExpiry, expiresAt);
    }

    if (!Number.isFinite(nearestExpiry)) {
      return;
    }

    const expiryDelay = Math.max(nearestExpiry - now + EXPIRY_TIMER_BUFFER_MS, 0);
    const timeoutId = window.setTimeout(
      () => {
        setRows((previousRows) =>
          previousRows.map((row) => {
            const status = getCurrentInviteStatus(row);
            if (status === row.status) {
              return row;
            }

            return { ...row, status };
          })
        );
      },
      Math.min(expiryDelay, MAX_TIMEOUT_DELAY_MS)
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [rows]);

  const lastInviteUrl = useMemo(() => {
    if (lastCreatedId === null) {
      return "";
    }

    const createdInvite = rows.find((row) => row.id === lastCreatedId);
    if (createdInvite?.status !== "active") {
      return "";
    }

    const token = tokenById[lastCreatedId];
    if (!token) {
      return "";
    }

    return buildInviteUrl(token);
  }, [lastCreatedId, rows, tokenById]);

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

  const handleCreate = useCallback(
    async (values: InviteFormValues) => {
      if (creatingRef.current) {
        return;
      }

      creatingRef.current = true;
      setCreating(true);

      try {
        const data = await createAdminInvite(values);

        const createdData = getCreatedInviteData(data);
        if (!createdData) {
          messageApi.error(ADMIN_INVITES_LABELS.createFail);
          return;
        }

        setRows((previousRows) => {
          const filteredRows = previousRows.filter((row) => row.id !== createdData.invite.id);
          return [createdData.invite, ...filteredRows];
        });
        setTokenById((previousTokens) => ({
          ...previousTokens,
          [createdData.invite.id]: createdData.token,
        }));
        setLastCreatedId(createdData.invite.id);
        form.resetFields();
        messageApi.success(ADMIN_INVITES_LABELS.createOk);
      } catch (error) {
        if (error instanceof AdminInvitesApiError) {
          messageApi.error(getApiErrorMessage(error.responseData, ADMIN_INVITES_LABELS.createFail));
          return;
        }

        messageApi.error(ADMIN_INVITES_LABELS.createFail);
      } finally {
        creatingRef.current = false;
        setCreating(false);
      }
    },
    [form, messageApi]
  );

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
