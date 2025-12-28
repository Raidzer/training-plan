"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import {
  Button,
  Card,
  Calendar,
  Checkbox,
  Divider,
  Input,
  InputNumber,
  message,
  Space,
  Tag,
  Typography,
} from "antd";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "./diary.module.scss";

type PlanEntry = {
  id: number;
  date: string;
  sessionOrder: number;
  taskText: string;
  commentText: string | null;
  isWorkload: boolean;
};

type WorkoutReport = {
  id: number;
  planEntryId: number;
  date: string;
  startTime: string;
  resultText: string;
  commentText: string | null;
};

type WeightEntry = {
  id: number;
  date: string;
  period: string;
  weightKg: string;
};

type RecoveryEntry = {
  id?: number;
  date: string;
  hasBath: boolean;
  hasMfr: boolean;
  hasMassage: boolean;
  overallScore: number | null;
  functionalScore: number | null;
  muscleScore: number | null;
  sleepHours: string | null;
};

type DayStatus = {
  date: string;
  hasWeightMorning: boolean;
  hasWeightEvening: boolean;
  workoutsTotal: number;
  workoutsWithFullReport: number;
  dayHasReport: boolean;
};

type DayPayload = {
  planEntries: PlanEntry[];
  workoutReports: WorkoutReport[];
  weightEntries: WeightEntry[];
  recoveryEntry: RecoveryEntry;
  status: DayStatus;
};

type DiaryDayMap = Record<string, DayStatus>;

type RecoveryForm = {
  hasBath: boolean;
  hasMfr: boolean;
  hasMassage: boolean;
  overallScore: number | null;
  functionalScore: number | null;
  muscleScore: number | null;
  sleepHours: number | null;
};

const formatDate = (value: Dayjs) => value.format("YYYY-MM-DD");
const parseDate = (value: string) => dayjs(value, "YYYY-MM-DD", true);
const isValidDateString = (value?: string | null) =>
  Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));

const getMonthRange = (value: Dayjs) => ({
  from: value.startOf("month").format("YYYY-MM-DD"),
  to: value.endOf("month").format("YYYY-MM-DD"),
});

const toDefaultWorkoutForm = (report?: WorkoutReport | null) => ({
  startTime: report?.startTime ?? "",
  resultText: report?.resultText ?? "",
  commentText: report?.commentText ?? "",
});

const parseOptionalNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed =
    typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

export function DiaryClient() {
  const searchParams = useSearchParams();
  const [messageApi, contextHolder] = message.useMessage();

  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => dayjs());
  const [panelDate, setPanelDate] = useState<Dayjs>(() => dayjs());
  const [marks, setMarks] = useState<DiaryDayMap>({});
  const [loadingMarks, setLoadingMarks] = useState(false);

  const [loadingDay, setLoadingDay] = useState(false);
  const [dayData, setDayData] = useState<DayPayload | null>(null);

  const [weightForm, setWeightForm] = useState({
    morning: "",
    evening: "",
  });
  const [recoveryForm, setRecoveryForm] = useState<RecoveryForm>({
    hasBath: false,
    hasMfr: false,
    hasMassage: false,
    overallScore: null,
    functionalScore: null,
    muscleScore: null,
    sleepHours: null,
  });
  const [savingWeight, setSavingWeight] = useState({
    morning: false,
    evening: false,
  });
  const [savingRecovery, setSavingRecovery] = useState(false);
  const [workoutForm, setWorkoutForm] = useState<
    Record<
      number,
      { startTime: string; resultText: string; commentText: string }
    >
  >({});
  const [savingWorkouts, setSavingWorkouts] = useState<Record<number, boolean>>(
    {}
  );

  useEffect(() => {
    const queryDate = searchParams.get("date");
    if (!isValidDateString(queryDate)) {
      return;
    }
    const parsed = parseDate(queryDate ?? "");
    if (!parsed.isValid()) {
      return;
    }
    if (!parsed.isSame(selectedDate, "day")) {
      setSelectedDate(parsed);
      setPanelDate(parsed);
    }
  }, [searchParams, selectedDate]);

  const loadMarks = useCallback(
    async (value: Dayjs) => {
      const { from, to } = getMonthRange(value);
      setLoadingMarks(true);
      try {
        const res = await fetch(`/api/diary/marks?from=${from}&to=${to}`);
        const data = (await res.json().catch(() => null)) as {
          days?: DayStatus[];
          error?: string;
        } | null;
        if (!res.ok || !data?.days) {
          messageApi.error(
            data?.error ?? "Не удалось загрузить отметки календаря."
          );
          return;
        }
        const nextMarks: DiaryDayMap = {};
        data.days.forEach((day) => {
          nextMarks[day.date] = day;
        });
        setMarks(nextMarks);
      } catch (err) {
        console.error(err);
        messageApi.error("Не удалось загрузить отметки календаря.");
      } finally {
        setLoadingMarks(false);
      }
    },
    [messageApi]
  );

  const loadDay = useCallback(
    async (value: Dayjs) => {
      const date = formatDate(value);
      setLoadingDay(true);
      try {
        const res = await fetch(`/api/diary/day?date=${date}`);
        const data = (await res.json().catch(() => null)) as
          | (DayPayload & { error?: string })
          | null;
        if (!res.ok || !data?.status) {
          messageApi.error(
            data?.error ?? "Не удалось загрузить дневник за день."
          );
          return;
        }
        setDayData(data);
        const nextWeight = { morning: "", evening: "" };
        data.weightEntries.forEach((entry) => {
          if (entry.period === "morning") {
            nextWeight.morning = entry.weightKg;
          }
          if (entry.period === "evening") {
            nextWeight.evening = entry.weightKg;
          }
        });
        setWeightForm(nextWeight);
        const nextRecovery = {
          hasBath: Boolean(data.recoveryEntry?.hasBath),
          hasMfr: Boolean(data.recoveryEntry?.hasMfr),
          hasMassage: Boolean(data.recoveryEntry?.hasMassage),
          overallScore: parseOptionalNumber(data.recoveryEntry?.overallScore),
          functionalScore: parseOptionalNumber(
            data.recoveryEntry?.functionalScore
          ),
          muscleScore: parseOptionalNumber(data.recoveryEntry?.muscleScore),
          sleepHours: parseOptionalNumber(data.recoveryEntry?.sleepHours),
        };
        setRecoveryForm(nextRecovery);
        const reportMap = new Map(
          data.workoutReports.map((report) => [report.planEntryId, report])
        );
        const nextWorkoutForm: Record<
          number,
          { startTime: string; resultText: string; commentText: string }
        > = {};
        data.planEntries.forEach((entry) => {
          nextWorkoutForm[entry.id] = toDefaultWorkoutForm(
            reportMap.get(entry.id)
          );
        });
        setWorkoutForm(nextWorkoutForm);
      } catch (err) {
        console.error(err);
        messageApi.error("Не удалось загрузить дневник за день.");
      } finally {
        setLoadingDay(false);
      }
    },
    [messageApi]
  );

  useEffect(() => {
    loadMarks(panelDate);
  }, [panelDate, loadMarks]);

  useEffect(() => {
    loadDay(selectedDate);
  }, [selectedDate, loadDay]);

  const updateSelectedDate = useCallback((value: Dayjs) => {
    setSelectedDate(value);
    setPanelDate(value);
  }, []);

  const shiftDate = useCallback(
    (amount: number, unit: "day" | "week" | "month") => {
      updateSelectedDate(selectedDate.add(amount, unit));
    },
    [selectedDate, updateSelectedDate]
  );

  const handleSaveWeight = useCallback(
    async (period: "morning" | "evening") => {
      const value =
        period === "morning" ? weightForm.morning : weightForm.evening;
      const weight = Number(String(value).replace(",", "."));
      if (!Number.isFinite(weight) || weight <= 0) {
        messageApi.error("Введите корректный вес.");
        return;
      }
      setSavingWeight((prev) => ({ ...prev, [period]: true }));
      try {
        const res = await fetch("/api/diary/weight", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            date: formatDate(selectedDate),
            period,
            weightKg: weight,
          }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          messageApi.error(data?.error ?? "Не удалось сохранить вес.");
          return;
        }
        messageApi.success("Вес сохранен.");
        loadDay(selectedDate);
        loadMarks(panelDate);
      } catch (err) {
        console.error(err);
        messageApi.error("Не удалось сохранить вес.");
      } finally {
        setSavingWeight((prev) => ({ ...prev, [period]: false }));
      }
    },
    [loadDay, loadMarks, messageApi, panelDate, selectedDate, weightForm]
  );

  const handleSaveWorkout = useCallback(
    async (planEntryId: number) => {
      const form = workoutForm[planEntryId];
      if (!form?.startTime || !form?.resultText) {
        messageApi.error("Время начала и результат обязательны.");
        return;
      }
      setSavingWorkouts((prev) => ({ ...prev, [planEntryId]: true }));
      try {
        const res = await fetch("/api/diary/workout-report", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            planEntryId,
            date: formatDate(selectedDate),
            startTime: form.startTime,
            resultText: form.resultText,
            commentText: form.commentText,
          }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          messageApi.error(
            data?.error ?? "Не удалось сохранить отчет о тренировке."
          );
          return;
        }
        messageApi.success("Отчет о тренировке сохранен.");
        loadDay(selectedDate);
        loadMarks(panelDate);
      } catch (err) {
        console.error(err);
        messageApi.error("Не удалось сохранить отчет о тренировке.");
      } finally {
        setSavingWorkouts((prev) => ({ ...prev, [planEntryId]: false }));
      }
    },
    [loadDay, loadMarks, messageApi, panelDate, selectedDate, workoutForm]
  );

  const handleSaveRecovery = useCallback(async () => {
    setSavingRecovery(true);
    try {
      const res = await fetch("/api/diary/recovery", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          date: formatDate(selectedDate),
          hasBath: recoveryForm.hasBath,
          hasMfr: recoveryForm.hasMfr,
          hasMassage: recoveryForm.hasMassage,
          overallScore: recoveryForm.overallScore,
          functionalScore: recoveryForm.functionalScore,
          muscleScore: recoveryForm.muscleScore,
          sleepHours: recoveryForm.sleepHours,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        messageApi.error(
          data?.error ?? "Не удалось сохранить отметки восстановления."
        );
        return;
      }
      messageApi.success("Отметки восстановления сохранены.");
      loadDay(selectedDate);
    } catch (err) {
      console.error(err);
      messageApi.error("Не удалось сохранить отметки восстановления.");
    } finally {
      setSavingRecovery(false);
    }
  }, [loadDay, messageApi, recoveryForm, selectedDate]);

  const quickActions = useMemo(
    () => [
      { label: "Предыдущий день", action: () => shiftDate(-1, "day") },
      { label: "Следующий день", action: () => shiftDate(1, "day") },
      { label: "Предыдущая неделя", action: () => shiftDate(-1, "week") },
      { label: "Следующая неделя", action: () => shiftDate(1, "week") },
      { label: "Предыдущий месяц", action: () => shiftDate(-1, "month") },
      { label: "Следующий месяц", action: () => shiftDate(1, "month") },
      { label: "Сегодня", action: () => updateSelectedDate(dayjs()) },
    ],
    [shiftDate, updateSelectedDate]
  );

  const status = dayData?.status;
  const workoutsComplete = status
    ? status.workoutsTotal === 0 ||
      status.workoutsWithFullReport === status.workoutsTotal
    : false;

  return (
    <main className={styles.mainContainer}>
      {contextHolder}
      <Card className={styles.cardStyle}>
        <Space direction="vertical" size="large" className={styles.spaceStyle}>
          <div className={styles.headerRow}>
            <div className={styles.headerText}>
              <Typography.Title level={3} className={styles.typographyTitle}>
                Дневник за день
              </Typography.Title>
              <Typography.Paragraph
                type="secondary"
                className={styles.typographyParagraph}
              >
                Отмечайте вес и отчеты о тренировках за выбранный день.
              </Typography.Paragraph>
            </div>
            <Space size="small" className={styles.headerActions}>
              <Link href="/diary/period" passHref>
                <Button>Просмотр периода</Button>
              </Link>
              <Link href="/dashboard" passHref>
                <Button>Назад к панели</Button>
              </Link>
            </Space>
          </div>
          <div className={styles.grid}>
            <div className={styles.calendarBlock}>
              <Card
                title="Календарь"
                loading={loadingMarks}
                className={styles.calendarCard}
              >
                <Space size="small" wrap className={styles.quickActions}>
                  {quickActions.map((item) => (
                    <Button key={item.label} size="small" onClick={item.action}>
                      {item.label}
                    </Button>
                  ))}
                </Space>
                <Divider className={styles.dividerTight} />
                <Calendar
                  value={selectedDate}
                  onSelect={(value) => updateSelectedDate(value)}
                  onPanelChange={(value) => setPanelDate(value)}
                  fullscreen={false}
                  cellRender={(value, info) => {
                    if (info.type !== "date") {
                      return info.originNode;
                    }
                    const key = formatDate(value);
                    const day = marks[key];
                    if (!day?.dayHasReport) {
                      return null;
                    }
                    return <span className={styles.markDot} />;
                  }}
                />
              </Card>
            </div>
            <div className={styles.dayBlock}>
              <Card
                title={`Выбранный день: ${formatDate(selectedDate)}`}
                loading={loadingDay}
                className={styles.dayCard}
              >
                <Space
                  direction="vertical"
                  size="middle"
                  className={styles.spaceStyle}
                >
                  <div className={styles.statusRow}>
                    {status?.dayHasReport ? (
                      <Tag color="green">День заполнен</Tag>
                    ) : (
                      <Tag>День не заполнен</Tag>
                    )}
                    <Tag
                      color={
                        status?.hasWeightMorning && status?.hasWeightEvening
                          ? "green"
                          : "default"
                      }
                    >
                      Вес: {status?.hasWeightMorning ? "У" : "-"} /{" "}
                      {status?.hasWeightEvening ? "В" : "-"}
                    </Tag>
                    <Tag color={workoutsComplete ? "green" : "orange"}>
                      Тренировки: {status?.workoutsWithFullReport ?? 0}/
                      {status?.workoutsTotal ?? 0}
                    </Tag>
                  </div>

                  <Card type="inner" title="Вес">
                    <div className={styles.weightGrid}>
                      <div className={styles.weightRow}>
                        <Input
                          value={weightForm.morning}
                          placeholder="Вес утром"
                          onChange={(event) =>
                            setWeightForm((prev) => ({
                              ...prev,
                              morning: event.target.value,
                            }))
                          }
                        />
                        <Button
                          type="primary"
                          loading={savingWeight.morning}
                          onClick={() => handleSaveWeight("morning")}
                        >
                          Сохранить
                        </Button>
                      </div>
                      <div className={styles.weightRow}>
                        <Input
                          value={weightForm.evening}
                          placeholder="Вес вечером"
                          onChange={(event) =>
                            setWeightForm((prev) => ({
                              ...prev,
                              evening: event.target.value,
                            }))
                          }
                        />
                        <Button
                          type="primary"
                          loading={savingWeight.evening}
                          onClick={() => handleSaveWeight("evening")}
                        >
                          Сохранить
                        </Button>
                      </div>
                    </div>
                  </Card>

                  <Card type="inner" title="Восстановление">
                    <div className={styles.recoveryGrid}>
                      <Checkbox
                        checked={recoveryForm.hasBath}
                        onChange={(event) =>
                          setRecoveryForm((prev) => ({
                            ...prev,
                            hasBath: event.target.checked,
                          }))
                        }
                      >
                        Баня
                      </Checkbox>
                      <Checkbox
                        checked={recoveryForm.hasMfr}
                        onChange={(event) =>
                          setRecoveryForm((prev) => ({
                            ...prev,
                            hasMfr: event.target.checked,
                          }))
                        }
                      >
                        МФР
                      </Checkbox>
                      <Checkbox
                        checked={recoveryForm.hasMassage}
                        onChange={(event) =>
                          setRecoveryForm((prev) => ({
                            ...prev,
                            hasMassage: event.target.checked,
                          }))
                        }
                      >
                        Массаж
                      </Checkbox>
                    </div>
                    <div className={styles.recoveryScores}>
                      <div className={styles.recoveryField}>
                        <Typography.Text>Общая оценка</Typography.Text>
                        <InputNumber
                          className={styles.recoveryInput}
                          min={1}
                          max={10}
                          step={1}
                          precision={0}
                          placeholder="1-10"
                          value={recoveryForm.overallScore}
                          onChange={(value) =>
                            setRecoveryForm((prev) => ({
                              ...prev,
                              overallScore: value,
                            }))
                          }
                        />
                      </div>
                      <div className={styles.recoveryField}>
                        <Typography.Text>
                          Функциональная оценка
                        </Typography.Text>
                        <InputNumber
                          className={styles.recoveryInput}
                          min={1}
                          max={10}
                          step={1}
                          precision={0}
                          placeholder="1-10"
                          value={recoveryForm.functionalScore}
                          onChange={(value) =>
                            setRecoveryForm((prev) => ({
                              ...prev,
                              functionalScore: value,
                            }))
                          }
                        />
                      </div>
                      <div className={styles.recoveryField}>
                        <Typography.Text>Мышечная оценка</Typography.Text>
                        <InputNumber
                          className={styles.recoveryInput}
                          min={1}
                          max={10}
                          step={1}
                          precision={0}
                          placeholder="1-10"
                          value={recoveryForm.muscleScore}
                          onChange={(value) =>
                            setRecoveryForm((prev) => ({
                              ...prev,
                              muscleScore: value,
                            }))
                          }
                        />
                      </div>
                      <div className={styles.recoveryField}>
                        <Typography.Text>Сон, часы</Typography.Text>
                        <InputNumber
                          className={styles.recoveryInput}
                          min={0}
                          max={24}
                          step={0.25}
                          precision={2}
                          placeholder="0-24"
                          value={recoveryForm.sleepHours}
                          onChange={(value) =>
                            setRecoveryForm((prev) => ({
                              ...prev,
                              sleepHours: value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className={styles.recoveryActions}>
                      <Button
                        type="primary"
                        loading={savingRecovery}
                        onClick={handleSaveRecovery}
                      >
                        Сохранить
                      </Button>
                    </div>
                  </Card>

                  <Card type="inner" title="Тренировки">
                    {dayData?.planEntries.length ? (
                      <Space orientation="vertical" size="middle">
                        {dayData.planEntries.map((entry) => {
                          const form = workoutForm[entry.id];
                          const isComplete =
                            Boolean(form?.resultText?.trim()) &&
                            Boolean(form?.commentText?.trim());
                          return (
                            <div key={entry.id} className={styles.workoutItem}>
                              <div className={styles.workoutHeader}>
                                <div>
                                  <Typography.Text strong>
                                    {entry.sessionOrder}. {entry.taskText}
                                  </Typography.Text>
                                  {entry.commentText ? (
                                    <Typography.Paragraph
                                      type="secondary"
                                      className={styles.paragraphTight}
                                    >
                                      {entry.commentText}
                                    </Typography.Paragraph>
                                  ) : null}
                                </div>
                                <Tag color={isComplete ? "green" : "default"}>
                                  {isComplete ? "Заполнено" : "Не заполнено"}
                                </Tag>
                              </div>
                              <div className={styles.workoutInputs}>
                                <Input
                                  value={form?.startTime ?? ""}
                                  placeholder="Время начала (ЧЧ:ММ)"
                                  onChange={(event) =>
                                    setWorkoutForm((prev) => ({
                                      ...prev,
                                      [entry.id]: {
                                        ...prev[entry.id],
                                        startTime: event.target.value,
                                      },
                                    }))
                                  }
                                />
                                <Input
                                  value={form?.resultText ?? ""}
                                  placeholder="Результат"
                                  onChange={(event) =>
                                    setWorkoutForm((prev) => ({
                                      ...prev,
                                      [entry.id]: {
                                        ...prev[entry.id],
                                        resultText: event.target.value,
                                      },
                                    }))
                                  }
                                />
                                <Input
                                  value={form?.commentText ?? ""}
                                  placeholder="Комментарий"
                                  onChange={(event) =>
                                    setWorkoutForm((prev) => ({
                                      ...prev,
                                      [entry.id]: {
                                        ...prev[entry.id],
                                        commentText: event.target.value,
                                      },
                                    }))
                                  }
                                />
                              </div>
                              <div className={styles.workoutActions}>
                                <Button
                                  type="primary"
                                  loading={savingWorkouts[entry.id]}
                                  onClick={() => handleSaveWorkout(entry.id)}
                                >
                                  Сохранить отчет
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </Space>
                    ) : (
                      <Typography.Text type="secondary">
                        На эту дату тренировки не запланированы.
                      </Typography.Text>
                    )}
                  </Card>
                </Space>
              </Card>
            </div>
          </div>
        </Space>
      </Card>
    </main>
  );
}
