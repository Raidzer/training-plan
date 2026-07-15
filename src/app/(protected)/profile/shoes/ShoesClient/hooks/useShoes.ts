"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MessageInstance } from "antd/es/message/interface";
import type { HookAPI as ModalHookAPI } from "antd/es/modal/useModal";
import { useSession } from "next-auth/react";
import { shoesLabels } from "../constants/shoesConstants";
import type {
  ShoeFormState,
  ShoeFormErrors,
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

const fetchShoesList = async () => {
  const response = await fetch("/api/shoes", { cache: "no-store" });
  const data = await response.json().catch(() => null);

  return {
    ok: response.ok,
    items: response.ok ? getShoesFromResponse(data) : [],
  };
};

export const useShoes = ({ messageApi, modalApi }: UseShoesParams) => {
  const { data: session, status: sessionStatus } = useSession();
  const [items, setItems] = useState<ShoeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newForm, setNewForm] = useState<ShoeFormState>(() => createEmptyForm());
  const [newFormErrors, setNewFormErrors] = useState<ShoeFormErrors>({});
  const [newValidationAttempt, setNewValidationAttempt] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingForm, setEditingForm] = useState<ShoeFormState>(() => createEmptyForm());
  const [editingFormErrors, setEditingFormErrors] = useState<ShoeFormErrors>({});
  const [editingValidationAttempt, setEditingValidationAttempt] = useState(0);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const createInFlightRef = useRef(false);
  const updateInFlightRef = useRef(false);
  const deleteInFlightIdsRef = useRef(new Set<number>());
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
    fetchShoesList()
      .then((result) => {
        if (!active) {
          return;
        }

        setItems(result.items);
        setLoadError(!result.ok);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setItems([]);
        setLoadError(true);
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

    if (key === "name" || key === "mileageLimitKm") {
      setNewFormErrors((previous) => ({ ...previous, [key]: undefined }));
    }

    setNewForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateEditingForm: ShoeFormUpdate = (key, value) => {
    if (value === true && !canEnableNotification(key)) {
      return;
    }

    if (key === "name" || key === "mileageLimitKm") {
      setEditingFormErrors((previous) => ({ ...previous, [key]: undefined }));
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

  const buildPayload = (
    form: ShoeFormState,
    emptyMileageValue: null | undefined,
    setFormErrors: (errors: ShoeFormErrors) => void
  ) => {
    const name = validateName(form.name);
    const mileageLimit = validateMileageLimit(form.mileageLimitKm, emptyMileageValue);
    const formErrors: ShoeFormErrors = {};

    if (!name.ok) {
      formErrors.name = name.error;
    }

    if (!mileageLimit.ok) {
      formErrors.mileageLimitKm = mileageLimit.error;
    }

    setFormErrors(formErrors);

    if (!name.ok) {
      messageApi.warning(name.error);
      return null;
    }

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
    if (createInFlightRef.current) {
      return;
    }

    const payload = buildPayload(newForm, undefined, setNewFormErrors);
    if (!payload) {
      setNewValidationAttempt((previous) => previous + 1);
      return;
    }

    createInFlightRef.current = true;
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
      setNewFormErrors({});
      messageApi.success(shoesLabels.saveOk);
    } catch (error) {
      messageApi.error(shoesLabels.saveFail);
      console.error(error);
    } finally {
      createInFlightRef.current = false;
      setSaving(false);
    }
  };

  const handleStartEdit = (item: ShoeItem) => {
    setEditingId(item.id);
    setEditingForm(sanitizeNotificationForm(createFormFromShoe(item), notificationAvailability));
    setEditingFormErrors({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingForm(createEmptyForm());
    setEditingFormErrors({});
  };

  const handleSaveEdit = async () => {
    if (editingId === null || updateInFlightRef.current) {
      return;
    }

    const payload = buildPayload(editingForm, null, setEditingFormErrors);
    if (!payload) {
      setEditingValidationAttempt((previous) => previous + 1);
      return;
    }

    const shoeId = editingId;
    updateInFlightRef.current = true;
    setUpdatingId(shoeId);
    try {
      const response = await fetch(`/api/shoes/${shoeId}`, {
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
      updateInFlightRef.current = false;
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
    if (deleteInFlightIdsRef.current.has(item.id)) {
      return;
    }

    deleteInFlightIdsRef.current.add(item.id);
    const confirmed = await confirmDelete(item.name);
    if (!confirmed) {
      deleteInFlightIdsRef.current.delete(item.id);
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
      deleteInFlightIdsRef.current.delete(item.id);
      setDeletingId(null);
    }
  };

  const handleRetry = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const result = await fetchShoesList();
      setItems(result.items);
      setLoadError(!result.ok);
    } catch (error) {
      setItems([]);
      setLoadError(true);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return {
    items,
    loading,
    loadError,
    saving,
    newForm,
    newFormErrors,
    newValidationAttempt,
    editingId,
    editingForm,
    editingFormErrors,
    editingValidationAttempt,
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
    handleRetry,
  };
};
