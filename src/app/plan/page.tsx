"use client";

import {
  BookOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FireOutlined,
  HomeOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  DatePicker,
  Input,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./plan.module.scss";

type PlanEntry = {
  id: number;
  date: string;
  sessionOrder: number;
  taskText: string;
  commentText: string | null;
  importId: number | null;
  isWorkload: boolean;
  hasReport: boolean;
};

type PlanDayEntry = {
  date: string;
  taskText: string;
  commentText: string | null;
  isWorkload: boolean;
  hasReport: boolean;
};

type PlanDraftEntry = {
  id?: number;
  taskText: string;
  commentText: string;
  hasReport: boolean;
};

type PlanDraft = {
  date: string;
  originalDate?: string;
  isWorkload: boolean;
  entries: PlanDraftEntry[];
};

const PAGE_SIZE = 20;
const PLAN_DATE_FORMAT = "YYYY-MM-DD";
const PLAN_DATE_DISPLAY_FORMAT = "DD.MM.YYYY";

const { TextArea } = Input;

const createEmptyDraftEntry = (): PlanDraftEntry => ({
  taskText: "",
  commentText: "",
  hasReport: false,
});

const formatNumberedLines = (
  values: Array<string | null | undefined>,
  options?: { emptyValue?: string; includeIfAllEmpty?: boolean }
) => {
  const emptyValue = options?.emptyValue ?? "-";
  if (!values.length) return options?.includeIfAllEmpty ? emptyValue : "";
  const normalized = values.map((value) => {
    if (value === null || value === undefined) return emptyValue;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : emptyValue;
  });
  const hasNonEmpty = normalized.some((value) => value !== emptyValue);
  if (!hasNonEmpty && !options?.includeIfAllEmpty) return "";
  if (normalized.length === 1) return normalized[0];
  return normalized.map((value, index) => `${index + 1}) ${value}`).join("\n");
};

const buildPlanDays = (entries: PlanEntry[]): PlanDayEntry[] => {
  const grouped = new Map<string, PlanEntry[]>();
  for (const entry of entries) {
    const existing = grouped.get(entry.date);
    if (existing) {
      existing.push(entry);
    } else {
      grouped.set(entry.date, [entry]);
    }
  }

  const rows: PlanDayEntry[] = [];
  for (const [date, dayEntries] of grouped) {
    const sorted = [...dayEntries].sort(
      (a, b) => a.sessionOrder - b.sessionOrder
    );
    const tasks = sorted.map((entry) => entry.taskText);
    const comments = sorted.map((entry) => entry.commentText ?? "");
    const commentText = formatNumberedLines(comments, {
      includeIfAllEmpty: false,
    });
    rows.push({
      date,
      taskText: formatNumberedLines(tasks, { includeIfAllEmpty: true }),
      commentText: commentText.length ? commentText : null,
      isWorkload: sorted.some((entry) => entry.isWorkload),
      hasReport: sorted.every((entry) => entry.hasReport),
    });
  }
  return rows;
};

const sortPlanEntries = (items: PlanEntry[]) =>
  [...items].sort((a, b) => {
    if (a.date === b.date) return a.sessionOrder - b.sessionOrder;
    return b.date.localeCompare(a.date);
  });

function PlanPageContent() {
  const { message: msgApi, modal: modalApi } = App.useApp();
  const [entries, setEntries] = useState<PlanEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [onlyWithoutReports, setOnlyWithoutReports] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<PlanDraft | null>(null);
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

  const openCreateModal = useCallback(() => {
    setDraft({
      date: today,
      isWorkload: false,
      entries: [createEmptyDraftEntry()],
    });
    setEditorOpen(true);
  }, [today]);

  const openEditModal = useCallback(
    (date: string) => {
      const dayEntries = entries
        .filter((entry) => entry.date === date)
        .sort((a, b) => a.sessionOrder - b.sessionOrder);
      if (!dayEntries.length) return;
      setDraft({
        date,
        originalDate: date,
        isWorkload: dayEntries.some((entry) => entry.isWorkload),
        entries: dayEntries.map((entry) => ({
          id: entry.id,
          taskText: entry.taskText,
          commentText: entry.commentText ?? "",
          hasReport: entry.hasReport,
        })),
      });
      setEditorOpen(true);
    },
    [entries]
  );

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setDraft(null);
  }, []);

  const handleCancelEditor = useCallback(() => {
    if (saving) return;
    closeEditor();
  }, [closeEditor, saving]);

  const updateDraft = useCallback((updater: (prev: PlanDraft) => PlanDraft) => {
    setDraft((prev) => (prev ? updater(prev) : prev));
  }, []);

  const handleDateChange = useCallback(
    (value: dayjs.Dayjs | null) => {
      if (!value) return;
      updateDraft((prev) => ({
        ...prev,
        date: value.format(PLAN_DATE_FORMAT),
      }));
    },
    [updateDraft]
  );

  const handleWorkloadChange = useCallback(
    (value: boolean) => {
      updateDraft((prev) => ({
        ...prev,
        isWorkload: value,
      }));
    },
    [updateDraft]
  );

  const updateEntry = useCallback(
    (index: number, patch: Partial<PlanDraftEntry>) => {
      updateDraft((prev) => {
        const entries = [...prev.entries];
        entries[index] = { ...entries[index], ...patch };
        return { ...prev, entries };
      });
    },
    [updateDraft]
  );

  const addEntry = useCallback(() => {
    updateDraft((prev) => ({
      ...prev,
      entries: [...prev.entries, createEmptyDraftEntry()],
    }));
  }, [updateDraft]);

  const removeEntry = useCallback(
    (index: number) => {
      updateDraft((prev) => {
        const entries = prev.entries.filter((_, i) => i !== index);
        if (entries.length === 0) entries.push(createEmptyDraftEntry());
        return { ...prev, entries };
      });
    },
    [updateDraft]
  );

  const confirmRemoveEntry = useCallback(
    (index: number) => {
      if (!draft) return;
      const entry = draft.entries[index];
      modalApi.confirm({
        title: "Удалить тренировку?",
        content:
          entry?.hasReport
            ? "При удалении тренировки будет удален связанный отчет."
            : "Удалить тренировку?",
        okText: "Удалить",
        okType: "danger",
        cancelText: "Отмена",
        onOk: () => removeEntry(index),
      });
    },
    [draft, modalApi, removeEntry]
  );

  const draftDateValue = useMemo(() => {
    if (!draft) return null;
    const parsed = dayjs(draft.date, PLAN_DATE_FORMAT, true);
    return parsed.isValid() ? parsed : null;
  }, [draft]);

  const handleSaveDraft = useCallback(async () => {
    if (!draft) return;
    const normalizedDate = draft.date.trim();
    if (!normalizedDate) {
      msgApi.error("Укажите дату");
      return;
    }

    if (
      entries.some(
        (entry) =>
          entry.date === normalizedDate && entry.date !== draft.originalDate
      )
    ) {
      msgApi.error("Эта дата уже есть в плане");
      return;
    }

    const normalizedEntries = draft.entries.map((entry) => {
      const taskText = entry.taskText.trim();
      const commentText = entry.commentText.trim();
      return {
        id: entry.id,
        taskText,
        commentText: commentText.length ? commentText : null,
      };
    });

    if (
      normalizedEntries.length === 0 ||
      normalizedEntries.some((entry) => !entry.taskText)
    ) {
      msgApi.error("Заполните все тренировки");
      return;
    }

    const payload: {
      date: string;
      originalDate?: string;
      isWorkload: boolean;
      entries: { id?: number; taskText: string; commentText: string | null }[];
    } = {
      date: normalizedDate,
      isWorkload: draft.isWorkload,
      entries: normalizedEntries.map((entry) => {
        const base = {
          taskText: entry.taskText,
          commentText: entry.commentText,
        };
        return entry.id ? { ...base, id: entry.id } : base;
      }),
    };

    if (draft.originalDate) {
      payload.originalDate = draft.originalDate;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as
        | { entries?: PlanEntry[]; error?: string }
        | null;

      if (!res.ok || !data?.entries) {
        const errorCode = data?.error;
        if (res.status === 409 || errorCode === "date_exists") {
          msgApi.error("Эта дата уже есть в плане");
        } else if (res.status === 404 || errorCode === "not_found") {
          msgApi.error("День не найден");
        } else if (errorCode === "invalid_entry_id") {
          msgApi.error("Некорректные данные тренировок");
        } else if (errorCode === "empty_entries") {
          msgApi.error("Заполните все тренировки");
        } else {
          msgApi.error("Не удалось сохранить день");
        }
        return;
      }

      const updatedEntries = data.entries;
      setEntries((prev) => {
        const removeDates = new Set<string>([normalizedDate]);
        if (draft.originalDate && draft.originalDate !== normalizedDate) {
          removeDates.add(draft.originalDate);
        }
        const filtered = prev.filter((entry) => !removeDates.has(entry.date));
        return sortPlanEntries([...filtered, ...updatedEntries]);
      });

      msgApi.success("День сохранен");
      closeEditor();
    } catch (err) {
      console.error(err);
      msgApi.error("Ошибка при сохранении дня");
    } finally {
      setSaving(false);
    }
  }, [closeEditor, draft, entries, msgApi]);

  const handleDeleteDay = useCallback(() => {
    if (!draft?.originalDate || saving) return;
    const targetDate = draft.originalDate;
    const hasReports = draft.entries.some((entry) => entry.hasReport);
    modalApi.confirm({
      title: "Удалить день?",
      content: hasReports
        ? "Удалятся все тренировки дня и связанные отчеты."
        : "Удалятся все тренировки дня.",
      okText: "Удалить",
      okType: "danger",
      cancelText: "Отмена",
      onOk: async () => {
        setSaving(true);
        try {
          const res = await fetch(
            `/api/plans?date=${encodeURIComponent(targetDate)}`,
            {
              method: "DELETE",
            }
          );
          const data = (await res.json().catch(() => null)) as
            | { deleted?: boolean; error?: string }
            | null;
          if (!res.ok || !data?.deleted) {
            const errorCode = data?.error;
            if (res.status === 404 || errorCode === "not_found") {
              msgApi.error("День не найден");
            } else {
              msgApi.error("Не удалось удалить день");
            }
            return;
          }
          setEntries((prev) => prev.filter((entry) => entry.date !== targetDate));
          msgApi.success("День удален");
          closeEditor();
        } catch (err) {
          console.error(err);
          msgApi.error("Ошибка при удалении дня");
        } finally {
          setSaving(false);
        }
      },
    });
  }, [closeEditor, draft, modalApi, msgApi, saving]);

  const columns: ColumnsType<PlanDayEntry> = useMemo(
    () => [
      {
        title: "Нагрузка",
        dataIndex: "isWorkload",
        width: 120,
        render: (value: boolean) =>
          value ? (
            <Tag icon={<FireOutlined />} color="volcano">
              Рабочая
            </Tag>
          ) : null,
      },
      {
        title: "Дата",
        dataIndex: "date",
        width: 120,
      },
      {
        title: "Задание",
        dataIndex: "taskText",
        render: (value: string) => (
          <span className={styles.multilineText}>{value}</span>
        ),
      },
      {
        title: "Комментарий",
        dataIndex: "commentText",
        render: (value: string | null) =>
          value ? (
            <span className={styles.multilineText}>{value}</span>
          ) : null,
      },
      {
        title: "Отчет",
        dataIndex: "hasReport",
        width: 120,
        render: (value: boolean) =>
          value ? (
            <Tag icon={<CheckCircleOutlined />} color="green">
              Заполнен
            </Tag>
          ) : null,
      },
      {
        title: "",
        key: "edit",
        width: 64,
        render: (_, record) => (
          <Tooltip title="Редактировать день">
            <Button
              size="small"
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record.date)}
              aria-label={`Редактировать день ${record.date}`}
            />
          </Tooltip>
        ),
      },
      {
        title: "Дневник",
        key: "diary",
        width: 64,
        render: (_, record) => (
          <Tooltip title="Открыть дневник">
            <Link href={`/diary?date=${record.date}`} passHref>
              <Button
                size="small"
                type="text"
                icon={<BookOutlined />}
                aria-label={`Открыть дневник на ${record.date}`}
              />
            </Link>
          </Tooltip>
        ),
      },
    ],
    [openEditModal]
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
        msgApi.error(data?.error ?? "Не удалось загрузить записи плана");
        return;
      }
      setEntries(data.entries);
    } catch (err) {
      console.error(err);
      msgApi.error("Произошла ошибка при загрузке плана");
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
      todayIndex < 0 ? 1 : Math.floor(todayIndex / PAGE_SIZE) + 1;
    setCurrentPage((prev) => (prev === nextPage ? prev : nextPage));
  }, [filteredEntries, onlyWithoutReports, today]);

  useEffect(() => {
    if (!todayEntryId || scrolledToTodayRef.current) return;
    const row = document.querySelector(`[data-row-key="${todayEntryId}"]`);
    if (!row) return;
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
                План тренировок
              </Typography.Title>
              <Typography.Paragraph
                type="secondary"
                className={styles.typographyParagraph}
              >
                Ниже — записи плана из базы (сортировка по дате и порядку
                сессии). Для загрузки нового файла воспользуйтесь кнопкой ниже.
              </Typography.Paragraph>
            </div>
            <Space size="small" className={styles.headerActions}>
              <Link href="/dashboard" passHref>
                <Button icon={<HomeOutlined />}>Главная</Button>
              </Link>
              <Button icon={<PlusOutlined />} onClick={openCreateModal}>
                Добавить день
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={load}
                loading={loading}
              >
                Обновить план
              </Button>
            </Space>
          </div>
          <Link href="/plan/import" passHref>
            <Button type="primary" block>
              Импортировать план из Excel
            </Button>
          </Link>
          <Space size="small" align="center">
            <Switch
              checked={onlyWithoutReports}
              onChange={setOnlyWithoutReports}
            />
            <Typography.Text>Только без отчетов</Typography.Text>
          </Space>
          <Modal
            open={editorOpen}
            title={draft?.originalDate ? "Редактировать день" : "Добавить день"}
            onCancel={handleCancelEditor}
            onOk={handleSaveDraft}
            okText="Сохранить"
            cancelText="Отмена"
            confirmLoading={saving}
            maskClosable={!saving}
            closable={!saving}
            destroyOnHidden
            okButtonProps={{
              disabled: saving,
            }}
            cancelButtonProps={{
              disabled: saving,
            }}
          >
            {draft ? (
              <Space
                orientation="vertical"
                size="middle"
                className={styles.editorForm}
              >
                <Space
                  size="middle"
                  align="center"
                  wrap
                  className={styles.editorTopRow}
                >
                  <div className={styles.editorField}>
                    <Typography.Text>Дата</Typography.Text>
                    <DatePicker
                      value={draftDateValue}
                      onChange={handleDateChange}
                      format={PLAN_DATE_DISPLAY_FORMAT}
                      allowClear={false}
                    />
                  </div>
                  <Space size="small" align="center">
                    <Switch
                      checked={draft.isWorkload}
                      onChange={handleWorkloadChange}
                    />
                    <Typography.Text>Нагрузка</Typography.Text>
                  </Space>
                </Space>
                <Space
                  orientation="vertical"
                  size="middle"
                  className={styles.editorEntries}
                >
                  {draft.entries.map((entry, index) => (
                    <Card key={entry.id ?? `new-${index}`} size="small">
                      <Space
                        orientation="vertical"
                        size="small"
                        className={styles.editorEntryBody}
                      >
                        <div className={styles.editorEntryHeader}>
                          <Typography.Text strong>
                            {`Тренировка ${index + 1}`}
                          </Typography.Text>
                          <Button
                            size="small"
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => confirmRemoveEntry(index)}
                            aria-label={`Удалить тренировку ${index + 1}`}
                          />
                        </div>
                        <div className={styles.editorField}>
                          <Typography.Text type="secondary">
                            Задание
                          </Typography.Text>
                          <TextArea
                            value={entry.taskText}
                            onChange={(event) =>
                              updateEntry(index, {
                                taskText: event.target.value,
                              })
                            }
                            autoSize={{ minRows: 2, maxRows: 6 }}
                          />
                        </div>
                        <div className={styles.editorField}>
                          <Typography.Text type="secondary">
                            Комментарий
                          </Typography.Text>
                          <TextArea
                            value={entry.commentText}
                            onChange={(event) =>
                              updateEntry(index, {
                                commentText: event.target.value,
                              })
                            }
                            autoSize={{ minRows: 2, maxRows: 6 }}
                          />
                        </div>
                      </Space>
                    </Card>
                  ))}
                </Space>
                <Space size="middle" wrap>
                  <Button icon={<PlusOutlined />} onClick={addEntry}>
                    Добавить тренировку
                  </Button>
                  {draft.originalDate ? (
                    <Button danger onClick={handleDeleteDay}>
                      Удалить день
                    </Button>
                  ) : null}
                </Space>
              </Space>
            ) : null}
          </Modal>
          <Table
            size="small"
            columns={columns}
            dataSource={filteredEntries}
            loading={loading}
            rowKey="date"
            rowClassName={(record) => {
              const rowClasses = [];
              if (record.isWorkload) rowClasses.push(styles.workloadRow);
              if (record.date === today) rowClasses.push(styles.todayRow);
              return rowClasses.join(" ");
            }}
            pagination={{
              pageSize: PAGE_SIZE,
              current: currentPage,
              onChange: (page) => setCurrentPage(page),
            }}
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
