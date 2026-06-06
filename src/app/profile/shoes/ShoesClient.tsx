"use client";

import { useCallback, useEffect, useState } from "react";
import { App, Card, Typography } from "antd";
import { ShoeCreateForm } from "./ShoeCreateForm/ShoeCreateForm";
import { ShoeList } from "./ShoeList/ShoeList";
import { shoesLabels } from "./shoes.constants";
import type { ShoeFormState, ShoeFormUpdate, ShoeItem, ShoeMutationPayload } from "./shoes.types";
import {
  createEmptyForm,
  createFormFromShoe,
  getShoeFromResponse,
  getShoesFromResponse,
  validateMileageLimit,
  validateName,
} from "./shoes.utils";
import styles from "./ShoesClient.module.scss";

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
            messageApi.error(shoesLabels.loadFail);
          }
          setItems([]);
          return;
        }
        setItems(getShoesFromResponse(data));
      } catch (error) {
        if (showError) {
          messageApi.error(shoesLabels.loadFail);
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

  const updateNewForm: ShoeFormUpdate = (key, value) => {
    setNewForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateEditingForm: ShoeFormUpdate = (key, value) => {
    setEditingForm((prev) => ({ ...prev, [key]: value }));
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

    const payload: ShoeMutationPayload = {
      name: name.value,
      notifyOnLimitEmail: form.notifyOnLimitEmail,
      notifyOnLimitTelegram: form.notifyOnLimitTelegram,
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
      const res = await fetch("/api/shoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
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

    const payload = buildPayload(editingForm, null);
    if (!payload) {
      return;
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
      const res = await fetch(`/api/shoes/${item.id}`, { method: "DELETE" });
      await res.json().catch(() => null);
      if (!res.ok) {
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

  return (
    <main className={styles.page}>
      <Card className={styles.card}>
        <Typography.Title level={3} className={styles.title}>
          {shoesLabels.title}
        </Typography.Title>
        <ShoeCreateForm
          form={newForm}
          saving={saving}
          onChange={updateNewForm}
          onSubmit={handleCreate}
        />
        <ShoeList
          items={items}
          loading={loading}
          saving={saving}
          editingId={editingId}
          editingForm={editingForm}
          updatingId={updatingId}
          deletingId={deletingId}
          onStartEdit={handleStartEdit}
          onChangeEdit={updateEditingForm}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
          onDelete={handleDelete}
        />
      </Card>
    </main>
  );
}
