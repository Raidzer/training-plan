"use client";

import { useEffect, useState } from "react";
import { Alert, App, Button, Card, Input, Typography } from "antd";
import styles from "./shoes.module.scss";

type ShoeItem = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type NameValidation =
  | { ok: true; value: string }
  | { ok: false; error: string };

const MAX_NAME_LENGTH = 255;

const labels = {
  title: "Обувь",
  subtitle: "Профиль в разработке, список обуви пока живет здесь.",
  alertTitle: "Временная страница",
  alertText: "Позже перенесем ее в профиль пользователя.",
  inputPlaceholder: "Nike Pegasus",
  addButton: "Добавить",
  listTitle: "Список обуви",
  editButton: "Редактировать",
  saveButton: "Сохранить",
  cancelButton: "Отмена",
  emptyText: "Пока нет обуви.",
  loadingText: "Загрузка...",
  helperText: "Можно добавлять и редактировать названия.",
  nameRequired: "Введите название.",
  nameTooLong: "Название длиннее 255 символов.",
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
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadShoes = async (showError = true) => {
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
  };

  useEffect(() => {
    void loadShoes(false);
  }, []);

  const handleCreate = async () => {
    const validation = validateName(newName);
    if (!validation.ok) {
      messageApi.warning(validation.error);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/shoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: validation.value }),
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
      setNewName("");
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
    setEditingName(item.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleSaveEdit = async () => {
    if (editingId === null) {
      return;
    }
    const validation = validateName(editingName);
    if (!validation.ok) {
      messageApi.warning(validation.error);
      return;
    }
    setUpdatingId(editingId);
    try {
      const res = await fetch(`/api/shoes/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: validation.value }),
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
              value={newName}
              onChange={(event) => {
                setNewName(event.target.value);
              }}
              placeholder={labels.inputPlaceholder}
              disabled={saving}
              className={styles.formInput}
            />
            <Button type="primary" onClick={handleCreate} loading={saving}>
              {labels.addButton}
            </Button>
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
                <Typography.Text type="secondary">
                  {labels.emptyText}
                </Typography.Text>
              ) : (
                <div>
                  {items.map((item) => {
                    const isEditing = editingId === item.id;
                    if (isEditing) {
                      return (
                        <div className={styles.listItem} key={item.id}>
                          <div className={styles.editRow}>
                            <Input
                              value={editingName}
                              onChange={(event) => {
                                setEditingName(event.target.value);
                              }}
                              disabled={updatingId === item.id}
                              className={styles.editInput}
                            />
                            <Button
                              type="primary"
                              onClick={handleSaveEdit}
                              loading={updatingId === item.id}
                            >
                              {labels.saveButton}
                            </Button>
                            <Button
                              onClick={handleCancelEdit}
                              disabled={updatingId === item.id}
                            >
                              {labels.cancelButton}
                            </Button>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className={styles.listItem} key={item.id}>
                        <div className={styles.itemRow}>
                          <Typography.Text className={styles.itemName}>
                            {item.name}
                          </Typography.Text>
                          <div className={styles.itemActions}>
                            <Button
                              type="link"
                              onClick={() => {
                                handleStartEdit(item);
                              }}
                              disabled={
                                saving || updatingId !== null || deletingId !== null
                              }
                            >
                              {labels.editButton}
                            </Button>
                            <Button
                              type="link"
                              danger
                              onClick={() => {
                                handleDelete(item);
                              }}
                              disabled={
                                saving || updatingId !== null || deletingId !== null
                              }
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
