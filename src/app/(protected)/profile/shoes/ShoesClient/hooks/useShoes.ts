"use client";

import { useEffect, useMemo, useState } from "react";
import type { MessageInstance } from "antd/es/message/interface";
import type { HookAPI as ModalHookAPI } from "antd/es/modal/useModal";
import { useSession } from "next-auth/react";
import { shoesLabels } from "../constants/shoesConstants";
import type {
  ShoeFormState,
  ShoeFormUpdate,
  ShoeItem,
  ShoeMutationPayload,
  ShoeNotificationAvailability,
} from "../types/shoesTypes";
import {
  createEmptyForm,
  createFormFromShoe,
  getShoeFromResponse,
  getShoesFromResponse,
  getTelegramLinkedFromResponse,
  sanitizeNotificationForm,
  validateMileageLimit,
  validateName,
} from "../utils/shoesUtils";

type UseShoesParams = {
  messageApi: MessageInstance;
  modalApi: ModalHookAPI;
};

export const useShoes = ({ messageApi, modalApi }: UseShoesParams) => {
  const { data: session, status: sessionStatus } = useSession();
  const [items, setItems] = useState<ShoeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newForm, setNewForm] = useState<ShoeFormState>(() => createEmptyForm());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingForm, setEditingForm] = useState<ShoeFormState>(() => createEmptyForm());
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [telegramStatus, setTelegramStatus] = useState({
    available: false,
    ready: false,
  });

  const notificationAvailability = useMemo<ShoeNotificationAvailability>(
    () => ({
      emailAvailable: sessionStatus === "authenticated" && Boolean(session?.user?.emailVerified),
      emailReady: sessionStatus !== "loading",
      telegramAvailable: telegramStatus.available,
      telegramReady: telegramStatus.ready,
    }),
    [session?.user?.emailVerified, sessionStatus, telegramStatus.available, telegramStatus.ready]
  );

  useEffect(() => {
    let active = true;
    fetch("/api/shoes", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!active) {
          return;
        }
        if (!response.ok) {
          setItems([]);
          return;
        }
        setItems(getShoesFromResponse(data));
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        console.error(error);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/telegram/status", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!active) {
          return;
        }
        setTelegramStatus({
          available: response.ok && getTelegramLinkedFromResponse(data),
          ready: true,
        });
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        console.error(error);
        setTelegramStatus({
          available: false,
          ready: true,
        });
      });

    return () => {
      active = false;
    };
  }, []);

  const canEnableNotification = (key: keyof ShoeFormState) => {
    if (key === "notifyOnLimitEmail") {
      if (!notificationAvailability.emailReady) {
        messageApi.warning(shoesLabels.notificationAvailabilityLoading);
        return false;
      }
      if (!notificationAvailability.emailAvailable) {
        messageApi.warning(shoesLabels.emailNotificationUnavailable);
        return false;
      }
    }

    if (key === "notifyOnLimitTelegram") {
      if (!notificationAvailability.telegramReady) {
        messageApi.warning(shoesLabels.notificationAvailabilityLoading);
        return false;
      }
      if (!notificationAvailability.telegramAvailable) {
        messageApi.warning(shoesLabels.telegramNotificationUnavailable);
        return false;
      }
    }

    return true;
  };

  const updateNewForm: ShoeFormUpdate = (key, value) => {
    if (value === true && !canEnableNotification(key)) {
      return;
    }
    setNewForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateEditingForm: ShoeFormUpdate = (key, value) => {
    if (value === true && !canEnableNotification(key)) {
      return;
    }
    setEditingForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateNotificationAvailability = (form: ShoeFormState) => {
    if (form.notifyOnLimitEmail) {
      if (!notificationAvailability.emailReady) {
        messageApi.warning(shoesLabels.notificationAvailabilityLoading);
        return false;
      }
      if (!notificationAvailability.emailAvailable) {
        messageApi.warning(shoesLabels.emailNotificationUnavailable);
        return false;
      }
    }

    if (form.notifyOnLimitTelegram) {
      if (!notificationAvailability.telegramReady) {
        messageApi.warning(shoesLabels.notificationAvailabilityLoading);
        return false;
      }
      if (!notificationAvailability.telegramAvailable) {
        messageApi.warning(shoesLabels.telegramNotificationUnavailable);
        return false;
      }
    }

    return true;
  };

  const buildPayload = (form: ShoeFormState, emptyMileageValue: null | undefined) => {
    const name = validateName(form.name);
    if (!name.ok) {
      messageApi.warning(name.error);
      return null;
    }

    const mileageLimit = validateMileageLimit(form.mileageLimitKm, emptyMileageValue);
    if (!mileageLimit.ok) {
      messageApi.warning(mileageLimit.error);
      return null;
    }

    const sanitizedForm = sanitizeNotificationForm(form, notificationAvailability);
    if (!validateNotificationAvailability(sanitizedForm)) {
      return null;
    }

    const payload: ShoeMutationPayload = {
      name: name.value,
      notifyOnLimitEmail: sanitizedForm.notifyOnLimitEmail,
      notifyOnLimitTelegram: sanitizedForm.notifyOnLimitTelegram,
    };

    if (mileageLimit.value !== undefined) {
      payload.mileageLimitKm = mileageLimit.value;
    }

    return payload;
  };

  const handleCreate = async () => {
    const payload = buildPayload(newForm, undefined);
    if (!payload) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/shoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        messageApi.error(shoesLabels.saveFail);
        return;
      }

      const created = getShoeFromResponse(data);
      if (!created) {
        messageApi.error(shoesLabels.saveFail);
        return;
      }

      setItems((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
      setNewForm(createEmptyForm());
      messageApi.success(shoesLabels.saveOk);
    } catch (error) {
      messageApi.error(shoesLabels.saveFail);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (item: ShoeItem) => {
    setEditingId(item.id);
    setEditingForm(sanitizeNotificationForm(createFormFromShoe(item), notificationAvailability));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingForm(createEmptyForm());
  };

  const handleSaveEdit = async () => {
    if (editingId === null) {
      return;
    }

    const payload = buildPayload(editingForm, null);
    if (!payload) {
      return;
    }

    setUpdatingId(editingId);
    try {
      const response = await fetch(`/api/shoes/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        messageApi.error(shoesLabels.updateFail);
        return;
      }

      const updated = getShoeFromResponse(data);
      if (!updated) {
        messageApi.error(shoesLabels.updateFail);
        return;
      }

      setItems((prev) => [updated, ...prev.filter((item) => item.id !== updated.id)]);
      messageApi.success(shoesLabels.updateOk);
      handleCancelEdit();
    } catch (error) {
      messageApi.error(shoesLabels.updateFail);
      console.error(error);
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmDelete = (name: string) =>
    new Promise<boolean>((resolve) => {
      modalApi.confirm({
        title: shoesLabels.deleteConfirm,
        content: `Удалить обувь "${name}"?`,
        okText: shoesLabels.deleteButton,
        okButtonProps: { danger: true },
        cancelText: shoesLabels.cancelButton,
        onOk: () => {
          resolve(true);
        },
        onCancel: () => {
          resolve(false);
        },
      });
    });

  const handleDelete = async (item: ShoeItem) => {
    const confirmed = await confirmDelete(item.name);
    if (!confirmed) {
      return;
    }

    setDeletingId(item.id);
    try {
      const response = await fetch(`/api/shoes/${item.id}`, { method: "DELETE" });
      await response.json().catch(() => null);

      if (!response.ok) {
        messageApi.error(shoesLabels.deleteFail);
        return;
      }

      setItems((prev) => prev.filter((existing) => existing.id !== item.id));
      if (editingId === item.id) {
        handleCancelEdit();
      }
      messageApi.success(shoesLabels.deleteOk);
    } catch (error) {
      messageApi.error(shoesLabels.deleteFail);
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  return {
    items,
    loading,
    saving,
    newForm,
    editingId,
    editingForm,
    notificationAvailability,
    updatingId,
    deletingId,
    updateNewForm,
    updateEditingForm,
    handleCreate,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleDelete,
  };
};
