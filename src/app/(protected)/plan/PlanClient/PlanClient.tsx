"use client";

import { HomeOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { App, Button, Card, Space, Switch, Typography } from "antd";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { PLAN_TEXT } from "./constants/planText";
import { PlanEditorModal } from "./components/PlanEditorModal/PlanEditorModal";
import { PlanEntriesTable } from "./components/PlanEntriesTable/PlanEntriesTable";
import { PlanShiftModal } from "./components/PlanShiftModal/PlanShiftModal";
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

  return (
    <main className={styles.mainContainer}>
      <Card className={styles.cardStyle}>
        <Space orientation="vertical" size="large" className={styles.spaceStyle}>
          <PageHeader
            title={PLAN_TEXT.header.title}
            subtitle={PLAN_TEXT.header.description}
            actions={
              <>
                <Link href="/dashboard" passHref>
                  <Button icon={<HomeOutlined />}>{PLAN_TEXT.actions.dashboard}</Button>
                </Link>
                <Button icon={<PlusOutlined />} onClick={openCreateModal}>
                  {PLAN_TEXT.actions.addDay}
                </Button>
                <Button icon={<ReloadOutlined />} onClick={loadEntries} loading={loading}>
                  {PLAN_TEXT.actions.reload}
                </Button>
              </>
            }
          />
          <div className={styles.importActions}>
            <Link href="/plan/import" passHref>
              <Button type="primary" block>
                {PLAN_TEXT.actions.importExcel}
              </Button>
            </Link>
            <Link href="/diary/import" passHref>
              <Button block>{PLAN_TEXT.actions.importDiary}</Button>
            </Link>
          </div>
          <Space size="small" align="center">
            <Switch checked={onlyWithoutReports} onChange={setOnlyWithoutReports} />
            <Typography.Text>{PLAN_TEXT.filter.onlyWithoutReports}</Typography.Text>
          </Space>
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
          <PlanEntriesTable
            entries={filteredEntries}
            loading={loading}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onEditDay={openEditModal}
            onShiftPlanFromDate={openShiftModal}
            today={today}
          />
        </Space>
      </Card>
    </main>
  );
}

export function PlanClient() {
  return (
    <App>
      <PlanClientContent />
    </App>
  );
}
