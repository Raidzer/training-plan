"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, App, Button, Card, Checkbox, Input, Typography } from "antd";
import styles from "./shoes.module.scss";

type ShoeItem = {
  id: number;
  name: string;
  mileageLimitKm: string | null;
  currentMileageKm: string | null;
  notifyOnLimitEmail: boolean;
  notifyOnLimitTelegram: boolean;
  createdAt: string;
  updatedAt: string;
};

type ShoeFormState = {
  name: string;
  mileageLimitKm: string;
  notifyOnLimitEmail: boolean;
  notifyOnLimitTelegram: boolean;
};

type NameValidation = { ok: true; value: string } | { ok: false; error: string };
type MileageValidation =
  | { ok: true; value: number | null | undefined }
  | { ok: false; error: string };

type ShoeMutationPayload = {
  name: string;
  mileageLimitKm?: number | null;
  notifyOnLimitEmail: boolean;
  notifyOnLimitTelegram: boolean;
};

const MAX_NAME_LENGTH = 255;
const MAX_MILEAGE_KM = 99999.99;

const labels = {
  title: "Обувь",
  subtitle: "Профиль в разработке, список обуви пока живет здесь.",
  alertTitle: "Временная страница",
  alertText: "Позже перенесем ее в профиль пользователя.",
  inputPlaceholder: "Nike Pegasus",
  mileageLimitPlaceholder: "Лимит пробега, км",
  addButton: "Добавить",
  listTitle: "Список обуви",
  editButton: "Редактировать",
  saveButton: "Сохранить",
  cancelButton: "Отмена",
  emptyText: "Пока нет обуви.",
  loadingText: "Загрузка...",
  helperText: "Название и настройки уведомлений.",
  nameRequired: "Введите название.",
  nameTooLong: "Название длиннее 255 символов.",
  mileageInvalid: "Пробег должен быть числом от 0 до 99999.99.",
  currentMileageLabel: "Текущий пробег",
  mileageLimitLabel: "Лимит",
  notificationsLabel: "Оповещения",
  mileageUnset: "не задан",
  notificationsOff: "выкл",
  emailNotification: "Email",
  telegramNotification: "Telegram",
  saveOk: "Обувь добавлена.",
  updateOk: "Обувь обновлена.",
  deleteButton: "Удалить",
  deleteConfirm: "Удалить обувь?",
  deleteOk: "Обувь удалена.",
  loadFail: "Не удалось загрузить список обуви.",
  saveFail: "Не удалось сохранить обувь.",
  updateFail: "Не удалось обновить обувь.",
  deleteFail: "Не удалось удалить обувь.",
} as const;

const validateName = (value: string): NameValidation => {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, error: labels.nameRequired };
  }
  if (trimmed.length > MAX_NAME_LENGTH) {
    return { ok: false, error: labels.nameTooLong };
  }
  return { ok: true, value: trimmed };
};

const validateMileageLimit = (value: string, emptyValue: null | undefined): MileageValidation => {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: true, value: emptyValue };
  }

  const parsed = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > MAX_MILEAGE_KM) {
    return { ok: false, error: labels.mileageInvalid };
  }

  return { ok: true, value: Math.round(parsed * 100) / 100 };
};

const formatMileageValue = (value: string | null) => {
  if (!value) {
    return labels.mileageUnset;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return labels.mileageUnset;
  }

  return `${new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 2,
  }).format(parsed)} км`;
};

const formatMileageInputValue = (value: string | null) => {
  if (!value) {
    return "";
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : "";
};

const formatNotifications = (item: ShoeItem) => {
  const channels: string[] = [];
  if (item.notifyOnLimitEmail) {
    channels.push(labels.emailNotification);
  }
  if (item.notifyOnLimitTelegram) {
    channels.push(labels.telegramNotification);
  }
  return channels.length > 0 ? channels.join(", ") : labels.notificationsOff;
};

const createEmptyForm = (): ShoeFormState => ({
  name: "",
  mileageLimitKm: "",
  notifyOnLimitEmail: false,
  notifyOnLimitTelegram: false,
});

const createFormFromShoe = (item: ShoeItem): ShoeFormState => ({
  name: item.name,
  mileageLimitKm: formatMileageInputValue(item.mileageLimitKm),
  notifyOnLimitEmail: item.notifyOnLimitEmail,
  notifyOnLimitTelegram: item.notifyOnLimitTelegram,
});

const getShoesFromResponse = (data: unknown): ShoeItem[] => {
  if (!data || typeof data !== "object") {
    return [];
  }
  const shoesValue = (data as { shoes?: unknown }).shoes;
  if (!Array.isArray(shoesValue)) {
    return [];
  }
  return shoesValue as ShoeItem[];
};

const getShoeFromResponse = (data: unknown): ShoeItem | null => {
  if (!data || typeof data !== "object") {
    return null;
  }
  const shoeValue = (data as { shoe?: unknown }).shoe;
  if (!shoeValue || typeof shoeValue !== "object") {
    return null;
  }
  return shoeValue as ShoeItem;
};

export function ShoesClient() {
  const { message: messageApi, modal: modalApi } = App.useApp();
  const [items, setItems] = useState<ShoeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newForm, setNewForm] = useState<ShoeFormState>(() => createEmptyForm());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingForm, setEditingForm] = useState<ShoeFormState>(() => createEmptyForm());
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadShoes = useCallback(
    async (showError = true) => {
      setLoading(true);
      try {
        const res = await fetch("/api/shoes", { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          if (showError) {
            messageApi.error(labels.loadFail);
          }
          setItems([]);
          return;
        }
        setItems(getShoesFromResponse(data));
      } catch (error) {
        if (showError) {
          messageApi.error(labels.loadFail);
        }
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [messageApi]
  );

  useEffect(() => {
    void loadShoes(false);
  }, [loadShoes]);

  const updateNewForm = <Key extends keyof ShoeFormState>(key: Key, value: ShoeFormState[Key]) => {
    setNewForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateEditingForm = <Key extends keyof ShoeFormState>(
    key: Key,
    value: ShoeFormState[Key]
  ) => {
    setEditingForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreate = async () => {
    const validation = validateName(newForm.name);
    if (!validation.ok) {
      messageApi.warning(validation.error);
      return;
    }
    const mileageLimit = validateMileageLimit(newForm.mileageLimitKm, undefined);
    if (!mileageLimit.ok) {
      messageApi.warning(mileageLimit.error);
      return;
    }

    const payload: ShoeMutationPayload = {
      name: validation.value,
      notifyOnLimitEmail: newForm.notifyOnLimitEmail,
      notifyOnLimitTelegram: newForm.notifyOnLimitTelegram,
    };
    if (mileageLimit.value !== undefined) {
      payload.mileageLimitKm = mileageLimit.value;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/shoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        messageApi.error(labels.saveFail);
        return;
      }
      const created = getShoeFromResponse(data);
      if (!created) {
        messageApi.error(labels.saveFail);
        return;
      }
      setItems((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
      setNewForm(createEmptyForm());
      messageApi.success(labels.saveOk);
    } catch (error) {
      messageApi.error(labels.saveFail);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (item: ShoeItem) => {
    setEditingId(item.id);
    setEditingForm(createFormFromShoe(item));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingForm(createEmptyForm());
  };

  const handleSaveEdit = async () => {
    if (editingId === null) {
      return;
    }
    const validation = validateName(editingForm.name);
    if (!validation.ok) {
      messageApi.warning(validation.error);
      return;
    }
    const mileageLimit = validateMileageLimit(editingForm.mileageLimitKm, null);
    if (!mileageLimit.ok) {
      messageApi.warning(mileageLimit.error);
      return;
    }

    const payload: ShoeMutationPayload = {
      name: validation.value,
      notifyOnLimitEmail: editingForm.notifyOnLimitEmail,
      notifyOnLimitTelegram: editingForm.notifyOnLimitTelegram,
    };
    if (mileageLimit.value !== undefined) {
      payload.mileageLimitKm = mileageLimit.value;
    }

    setUpdatingId(editingId);
    try {
      const res = await fetch(`/api/shoes/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        messageApi.error(labels.updateFail);
        return;
      }
      const updated = getShoeFromResponse(data);
      if (!updated) {
        messageApi.error(labels.updateFail);
        return;
      }
      setItems((prev) => [updated, ...prev.filter((item) => item.id !== updated.id)]);
      messageApi.success(labels.updateOk);
      handleCancelEdit();
    } catch (error) {
      messageApi.error(labels.updateFail);
      console.error(error);
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmDelete = (name: string) =>
    new Promise<boolean>((resolve) => {
      modalApi.confirm({
        title: labels.deleteConfirm,
        content: `Удалить обувь "${name}"?`,
        okText: labels.deleteButton,
        okButtonProps: { danger: true },
        cancelText: labels.cancelButton,
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
      const res = await fetch(`/api/shoes/${item.id}`, { method: "DELETE" });
      await res.json().catch(() => null);
      if (!res.ok) {
        messageApi.error(labels.deleteFail);
        return;
      }
      setItems((prev) => prev.filter((existing) => existing.id !== item.id));
      if (editingId === item.id) {
        handleCancelEdit();
      }
      messageApi.success(labels.deleteOk);
    } catch (error) {
      messageApi.error(labels.deleteFail);
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className={styles.page}>
      <Card className={styles.card}>
        <Typography.Title level={3} className={styles.title}>
          {labels.title}
        </Typography.Title>
        <Typography.Paragraph type="secondary" className={styles.subtitle}>
          {labels.subtitle}
        </Typography.Paragraph>
        <Alert
          type="info"
          title={labels.alertTitle}
          description={labels.alertText}
          showIcon
          className={styles.alert}
        />

        <div className={styles.form}>
          <Typography.Text type="secondary">{labels.helperText}</Typography.Text>
          <div className={styles.formRow}>
            <Input
              value={newForm.name}
              onChange={(event) => {
                updateNewForm("name", event.target.value);
              }}
              placeholder={labels.inputPlaceholder}
              disabled={saving}
              className={styles.formInput}
            />
            <Input
              value={newForm.mileageLimitKm}
              onChange={(event) => {
                updateNewForm("mileageLimitKm", event.target.value);
              }}
              placeholder={labels.mileageLimitPlaceholder}
              disabled={saving}
              inputMode="decimal"
              className={styles.limitInput}
            />
            <Button type="primary" onClick={handleCreate} loading={saving}>
              {labels.addButton}
            </Button>
          </div>
          <div className={styles.settingsRow}>
            <Checkbox
              checked={newForm.notifyOnLimitEmail}
              disabled={saving}
              onChange={(event) => {
                updateNewForm("notifyOnLimitEmail", event.target.checked);
              }}
            >
              {labels.emailNotification}
            </Checkbox>
            <Checkbox
              checked={newForm.notifyOnLimitTelegram}
              disabled={saving}
              onChange={(event) => {
                updateNewForm("notifyOnLimitTelegram", event.target.checked);
              }}
            >
              {labels.telegramNotification}
            </Checkbox>
          </div>
        </div>

        <Typography.Title level={5} className={styles.listTitle}>
          {labels.listTitle}
        </Typography.Title>
        <div className={styles.list}>
          {loading ? (
            <Typography.Text>{labels.loadingText}</Typography.Text>
          ) : (
            <>
              {items.length === 0 ? (
                <Typography.Text type="secondary">{labels.emptyText}</Typography.Text>
              ) : (
                <div>
                  {items.map((item) => {
                    const isEditing = editingId === item.id;
                    if (isEditing) {
                      return (
                        <div className={styles.listItem} key={item.id}>
                          <div className={styles.editForm}>
                            <div className={styles.editRow}>
                              <Input
                                value={editingForm.name}
                                onChange={(event) => {
                                  updateEditingForm("name", event.target.value);
                                }}
                                disabled={updatingId === item.id}
                                className={styles.editInput}
                              />
                              <Input
                                value={editingForm.mileageLimitKm}
                                onChange={(event) => {
                                  updateEditingForm("mileageLimitKm", event.target.value);
                                }}
                                placeholder={labels.mileageLimitPlaceholder}
                                disabled={updatingId === item.id}
                                inputMode="decimal"
                                className={styles.limitInput}
                              />
                            </div>
                            <Typography.Text type="secondary" className={styles.itemMetaText}>
                              {labels.currentMileageLabel}:{" "}
                              {formatMileageValue(item.currentMileageKm)}
                            </Typography.Text>
                            <div className={styles.settingsRow}>
                              <Checkbox
                                checked={editingForm.notifyOnLimitEmail}
                                disabled={updatingId === item.id}
                                onChange={(event) => {
                                  updateEditingForm("notifyOnLimitEmail", event.target.checked);
                                }}
                              >
                                {labels.emailNotification}
                              </Checkbox>
                              <Checkbox
                                checked={editingForm.notifyOnLimitTelegram}
                                disabled={updatingId === item.id}
                                onChange={(event) => {
                                  updateEditingForm("notifyOnLimitTelegram", event.target.checked);
                                }}
                              >
                                {labels.telegramNotification}
                              </Checkbox>
                            </div>
                            <div className={styles.editActions}>
                              <Button
                                type="primary"
                                onClick={handleSaveEdit}
                                loading={updatingId === item.id}
                              >
                                {labels.saveButton}
                              </Button>
                              <Button onClick={handleCancelEdit} disabled={updatingId === item.id}>
                                {labels.cancelButton}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className={styles.listItem} key={item.id}>
                        <div className={styles.itemRow}>
                          <div className={styles.itemInfo}>
                            <Typography.Text className={styles.itemName}>
                              {item.name}
                            </Typography.Text>
                            <div className={styles.itemMeta}>
                              <Typography.Text type="secondary" className={styles.itemMetaText}>
                                {labels.currentMileageLabel}:{" "}
                                {formatMileageValue(item.currentMileageKm)}
                              </Typography.Text>
                              <Typography.Text type="secondary" className={styles.itemMetaText}>
                                {labels.mileageLimitLabel}:{" "}
                                {formatMileageValue(item.mileageLimitKm)}
                              </Typography.Text>
                              <Typography.Text type="secondary" className={styles.itemMetaText}>
                                {labels.notificationsLabel}: {formatNotifications(item)}
                              </Typography.Text>
                            </div>
                          </div>
                          <div className={styles.itemActions}>
                            <Button
                              type="link"
                              onClick={() => {
                                handleStartEdit(item);
                              }}
                              disabled={saving || updatingId !== null || deletingId !== null}
                            >
                              {labels.editButton}
                            </Button>
                            <Button
                              type="link"
                              danger
                              onClick={() => {
                                handleDelete(item);
                              }}
                              disabled={saving || updatingId !== null || deletingId !== null}
                              loading={deletingId === item.id}
                            >
                              {labels.deleteButton}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </main>
  );
}
