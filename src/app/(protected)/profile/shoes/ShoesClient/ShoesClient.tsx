"use client";

import { App, Card, Typography } from "antd";
import { ShoeCreateForm } from "./components/ShoeCreateForm/ShoeCreateForm";
import { ShoeList } from "./components/ShoeList/ShoeList";
import { shoesLabels } from "./constants/shoesConstants";
import { useShoes } from "./hooks/useShoes";
import styles from "./ShoesClient.module.scss";

export function ShoesClient() {
  const { message: messageApi, modal: modalApi } = App.useApp();
  const {
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
  } = useShoes({ messageApi, modalApi });

  return (
    <main className={styles.page}>
      <Card className={styles.card}>
        <Typography.Title level={3} className={styles.title}>
          {shoesLabels.title}
        </Typography.Title>
        <ShoeCreateForm
          form={newForm}
          saving={saving}
          notificationAvailability={notificationAvailability}
          onChange={updateNewForm}
          onSubmit={handleCreate}
        />
        <ShoeList
          items={items}
          loading={loading}
          saving={saving}
          editingId={editingId}
          editingForm={editingForm}
          notificationAvailability={notificationAvailability}
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
