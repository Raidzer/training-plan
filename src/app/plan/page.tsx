"use client";

import { HomeOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { App, Button, Card, Space, Switch, Typography } from "antd";
import dayjs from "dayjs";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./plan.module.scss";
import type { PlanEntry } from "./planUtils";
import { PlanEditorModal } from "./components/PlanEditorModal";
import { PlanEntriesTable } from "./components/PlanEntriesTable";
import { PLAN_DATE_FORMAT, PLAN_PAGE_SIZE } from "./planConstants";
import { PLAN_TEXT } from "./planText";
import { buildPlanDays } from "./planUtils";
import { usePlanEditor } from "./hooks/usePlanEditor";

function PlanPageContent() {
  const { message: msgApi, modal: modalApi } = App.useApp();
  const [entries, setEntries] = useState<PlanEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [onlyWithoutReports, setOnlyWithoutReports] = useState(false);
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
  const scrolledToTodayRef = useRef(false);
  const today = useMemo(() => dayjs().format(PLAN_DATE_FORMAT), []);

  const groupedEntries = useMemo(() => buildPlanDays(entries), [entries]);
  const filteredEntries = useMemo(
    () =>
      onlyWithoutReports
        ? groupedEntries.filter((entry) => !entry.hasReport)
        : groupedEntries,
    [groupedEntries, onlyWithoutReports]
  );

  const todayEntryId = useMemo(
    () => filteredEntries.find((entry) => entry.date === today)?.date ?? null,
    [filteredEntries, today]
  );

  const load = useCallback(async () => {
    scrolledToTodayRef.current = false;
    setLoading(true);
    try {
      const res = await fetch("/api/plans");
      const data = (await res.json().catch(() => null)) as {
        entries?: PlanEntry[];
        error?: string;
      } | null;
      if (!res.ok || !data?.entries) {
        msgApi.error(data?.error ?? PLAN_TEXT.messages.loadFailed);
        return;
      }
      setEntries(data.entries);
    } catch (err) {
      console.error(err);
      msgApi.error(PLAN_TEXT.messages.loadError);
    } finally {
      setLoading(false);
    }
  }, [msgApi]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    scrolledToTodayRef.current = false;
    if (onlyWithoutReports) {
      setCurrentPage((prev) => (prev === 1 ? prev : 1));
      return;
    }
    const todayIndex = filteredEntries.findIndex(
      (entry) => entry.date === today
    );
    const nextPage =
      todayIndex < 0 ? 1 : Math.floor(todayIndex / PLAN_PAGE_SIZE) + 1;
    setCurrentPage((prev) => (prev === nextPage ? prev : nextPage));
  }, [filteredEntries, onlyWithoutReports, today]);

  useEffect(() => {
    if (!todayEntryId || scrolledToTodayRef.current) {
      return;
    }
    const row = document.querySelector(`[data-row-key="${todayEntryId}"]`);
    if (!row) {
      return;
    }
    row.scrollIntoView({ block: "center", behavior: "smooth" });
    scrolledToTodayRef.current = true;
  }, [todayEntryId, currentPage]);

  return (
    <main className={styles.mainContainer}>
      <Card className={styles.cardStyle}>
        <Space
          orientation="vertical"
          size="large"
          className={styles.spaceStyle}
        >
          <div className={styles.headerRow}>
            <div className={styles.headerText}>
              <Typography.Title level={3} className={styles.typographyTitle}>
                {PLAN_TEXT.header.title}
              </Typography.Title>
              <Typography.Paragraph
                type="secondary"
                className={styles.typographyParagraph}
              >
                {PLAN_TEXT.header.description}
              </Typography.Paragraph>
            </div>
            <Space size="small" className={styles.headerActions}>
              <Link href="/dashboard" passHref>
                <Button icon={<HomeOutlined />}>{PLAN_TEXT.actions.dashboard}</Button>
              </Link>
              <Button icon={<PlusOutlined />} onClick={openCreateModal}>
                {PLAN_TEXT.actions.addDay}
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={load}
                loading={loading}
              >
                {PLAN_TEXT.actions.reload}
              </Button>
            </Space>
          </div>
          <Link href="/plan/import" passHref>
            <Button type="primary" block>
              {PLAN_TEXT.actions.importExcel}
            </Button>
          </Link>
          <Space size="small" align="center">
            <Switch
              checked={onlyWithoutReports}
              onChange={setOnlyWithoutReports}
            />
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
          <PlanEntriesTable
            entries={filteredEntries}
            loading={loading}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onEditDay={openEditModal}
            today={today}
          />
        </Space>
      </Card>
    </main>
  );
}

export default function PlanPage() {
  return (
    <App>
      <PlanPageContent />
    </App>
  );
}
