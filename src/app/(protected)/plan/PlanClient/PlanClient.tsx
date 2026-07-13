"use client";

import { App } from "antd";
import { PLAN_TEXT } from "./constants/planText";
import { PlanEditorModal } from "./components/PlanEditorModal/PlanEditorModal";
import { PlanHeader } from "./components/PlanHeader/PlanHeader";
import { PlanSchedule } from "./components/PlanSchedule/PlanSchedule";
import { PlanShiftModal } from "./components/PlanShiftModal/PlanShiftModal";
import { PlanToolbar, type PlanFilterValue } from "./components/PlanToolbar/PlanToolbar";
import { usePlanEditor } from "./hooks/usePlanEditor";
import { usePlanEntries } from "./hooks/usePlanEntries";
import { usePlanShift } from "./hooks/usePlanShift";
import styles from "./PlanClient.module.scss";

function PlanClientContent() {
  const { message: msgApi, modal: modalApi } = App.useApp();
  const {
    entries,
    setEntries,
    filteredEntries,
    loadError,
    loading,
    currentPage,
    setCurrentPage,
    onlyWithoutReports,
    setOnlyWithoutReports,
    today,
    loadEntries,
  } = usePlanEntries({ msgApi });
  const {
    editorOpen,
    saving,
    draft,
    draftDateValue,
    openCreateModal,
    openEditModal,
    handleCancelEditor,
    handleDateChange,
    handleWorkloadChange,
    updateEntry,
    addEntry,
    confirmRemoveEntry,
    handleSaveDraft,
    handleDeleteDay,
  } = usePlanEditor({ entries, setEntries, msgApi, modalApi });
  const {
    shiftOpen,
    shiftSaving,
    shiftDraft,
    shiftDateValue,
    openShiftModal,
    handleCancelShift,
    handleShiftDateChange,
    handleShiftDirectionChange,
    handleShiftDaysChange,
    handleSaveShift,
  } = usePlanShift({ msgApi, loadEntries });

  const handleFilterChange = (value: PlanFilterValue) => {
    setOnlyWithoutReports(value === "without-reports");
  };

  return (
    <div className={styles.mainContainer}>
      <div className={styles.pageStack}>
        <PlanHeader
          eyebrow={PLAN_TEXT.header.eyebrow}
          title={PLAN_TEXT.header.title}
          subtitle={PLAN_TEXT.header.description}
          dashboardHref="/dashboard"
          dashboardLabel={PLAN_TEXT.actions.dashboard}
          addDayLabel={PLAN_TEXT.actions.addDay}
          onAddDay={openCreateModal}
        />

        <PlanToolbar
          filterValue={onlyWithoutReports ? "without-reports" : "all"}
          allDaysLabel={PLAN_TEXT.filter.all}
          withoutReportsLabel={PLAN_TEXT.filter.onlyWithoutReports}
          importPlanHref="/plan/import"
          importPlanLabel={PLAN_TEXT.actions.importExcel}
          importDiaryHref="/diary/import"
          importDiaryLabel={PLAN_TEXT.actions.importDiary}
          reloadLabel={PLAN_TEXT.actions.reload}
          loading={loading}
          onFilterChange={handleFilterChange}
          onReload={() => {
            void loadEntries();
          }}
        />

        <PlanSchedule
          entries={filteredEntries}
          loading={loading}
          loadError={loadError}
          isFiltered={onlyWithoutReports}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onEditDay={openEditModal}
          onShiftPlanFromDate={openShiftModal}
          onAddDay={openCreateModal}
          onRetry={loadEntries}
          today={today}
        />
      </div>

      <PlanEditorModal
        open={editorOpen}
        draft={draft}
        saving={saving}
        dateValue={draftDateValue}
        onCancel={handleCancelEditor}
        onSave={handleSaveDraft}
        onDateChange={handleDateChange}
        onWorkloadChange={handleWorkloadChange}
        onEntryChange={updateEntry}
        onAddEntry={addEntry}
        onRemoveEntry={confirmRemoveEntry}
        onDeleteDay={handleDeleteDay}
      />
      <PlanShiftModal
        open={shiftOpen}
        draft={shiftDraft}
        saving={shiftSaving}
        dateValue={shiftDateValue}
        onCancel={handleCancelShift}
        onSave={handleSaveShift}
        onDateChange={handleShiftDateChange}
        onDirectionChange={handleShiftDirectionChange}
        onDaysChange={handleShiftDaysChange}
      />
    </div>
  );
}

export function PlanClient() {
  return (
    <App>
      <PlanClientContent />
    </App>
  );
}
