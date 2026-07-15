"use client";

import { App } from "antd";
import { ShoeCreateForm } from "./components/ShoeCreateForm/ShoeCreateForm";
import { ShoeList } from "./components/ShoeList/ShoeList";
import { ShoesHeader } from "./components/ShoesHeader/ShoesHeader";
import { ShoesOverview } from "./components/ShoesOverview/ShoesOverview";
import { useShoes } from "./hooks/useShoes";
import styles from "./ShoesClient.module.scss";

export function ShoesClient() {
  const { message: messageApi, modal: modalApi } = App.useApp();
  const {
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
  } = useShoes({ messageApi, modalApi });
  const addDisabled =
    loading || loadError || editingId !== null || updatingId !== null || deletingId !== null;

  return (
    <div className={styles.page}>
      <ShoesHeader />
      <ShoesOverview items={items} loading={loading} loadError={loadError} />

      <div className={styles.workspace}>
        <ShoeList
          items={items}
          loading={loading}
          loadError={loadError}
          addDisabled={addDisabled}
          saving={saving}
          editingId={editingId}
          editingForm={editingForm}
          editingFormErrors={editingFormErrors}
          editingValidationAttempt={editingValidationAttempt}
          notificationAvailability={notificationAvailability}
          updatingId={updatingId}
          deletingId={deletingId}
          onStartEdit={handleStartEdit}
          onChangeEdit={updateEditingForm}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
          onDelete={handleDelete}
          onRetry={handleRetry}
        />
        <ShoeCreateForm
          form={newForm}
          errors={newFormErrors}
          validationAttempt={newValidationAttempt}
          saving={saving}
          disabled={addDisabled}
          notificationAvailability={notificationAvailability}
          onChange={updateNewForm}
          onSubmit={handleCreate}
        />
      </div>
    </div>
  );
}
