"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import {
  Button,
  Card,
  Calendar,
  Divider,
  Input,
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
  status: DayStatus;
};

type DiaryDayMap = Record<string, DayStatus>;

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
  const [savingWeight, setSavingWeight] = useState({
    morning: false,
    evening: false,
  });
  const [workoutForm, setWorkoutForm] = useState<
    Record<number, { startTime: string; resultText: string; commentText: string }>
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

  const loadMarks = useCallback(async (value: Dayjs) => {
    const { from, to } = getMonthRange(value);
    setLoadingMarks(true);
    try {
      const res = await fetch(`/api/diary/marks?from=${from}&to=${to}`);
      const data = (await res.json().catch(() => null)) as
        | { days?: DayStatus[]; error?: string }
        | null;
      if (!res.ok || !data?.days) {
        messageApi.error(data?.error ?? "Failed to load calendar marks.");
        return;
      }
      const nextMarks: DiaryDayMap = {};
      data.days.forEach((day) => {
        nextMarks[day.date] = day;
      });
      setMarks(nextMarks);
    } catch (err) {
      console.error(err);
      messageApi.error("Failed to load calendar marks.");
    } finally {
      setLoadingMarks(false);
    }
  }, [messageApi]);

  const loadDay = useCallback(async (value: Dayjs) => {
    const date = formatDate(value);
    setLoadingDay(true);
    try {
      const res = await fetch(`/api/diary/day?date=${date}`);
      const data = (await res.json().catch(() => null)) as
        | (DayPayload & { error?: string })
        | null;
      if (!res.ok || !data?.status) {
        messageApi.error(data?.error ?? "Failed to load diary day.");
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
      messageApi.error("Failed to load diary day.");
    } finally {
      setLoadingDay(false);
    }
  }, [messageApi]);

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
      const value = period === "morning" ? weightForm.morning : weightForm.evening;
      const weight = Number(String(value).replace(",", "."));
      if (!Number.isFinite(weight) || weight <= 0) {
        messageApi.error("Enter a valid weight.");
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
          const data = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          messageApi.error(data?.error ?? "Failed to save weight.");
          return;
        }
        messageApi.success("Weight saved.");
        loadDay(selectedDate);
        loadMarks(panelDate);
      } catch (err) {
        console.error(err);
        messageApi.error("Failed to save weight.");
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
        messageApi.error("Start time and result are required.");
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
          const data = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          messageApi.error(data?.error ?? "Failed to save workout report.");
          return;
        }
        messageApi.success("Workout report saved.");
        loadDay(selectedDate);
        loadMarks(panelDate);
      } catch (err) {
        console.error(err);
        messageApi.error("Failed to save workout report.");
      } finally {
        setSavingWorkouts((prev) => ({ ...prev, [planEntryId]: false }));
      }
    },
    [loadDay, loadMarks, messageApi, panelDate, selectedDate, workoutForm]
  );

  const quickActions = useMemo(
    () => [
      { label: "Prev day", action: () => shiftDate(-1, "day") },
      { label: "Next day", action: () => shiftDate(1, "day") },
      { label: "Prev week", action: () => shiftDate(-1, "week") },
      { label: "Next week", action: () => shiftDate(1, "week") },
      { label: "Prev month", action: () => shiftDate(-1, "month") },
      { label: "Next month", action: () => shiftDate(1, "month") },
      { label: "Today", action: () => updateSelectedDate(dayjs()) },
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
                Diary day
              </Typography.Title>
              <Typography.Paragraph
                type="secondary"
                className={styles.typographyParagraph}
              >
                Track weight and workout reports for the selected day.
              </Typography.Paragraph>
            </div>
            <Space size="small" className={styles.headerActions}>
              <Link href="/diary/period" passHref>
                <Button>Period view</Button>
              </Link>
              <Link href="/dashboard" passHref>
                <Button>Back to dashboard</Button>
              </Link>
            </Space>
          </div>
          <div className={styles.grid}>
            <div className={styles.calendarBlock}>
              <Card
                title="Calendar"
                loading={loadingMarks}
                className={styles.calendarCard}
              >
                <Space
                  size="small"
                  wrap
                  className={styles.quickActions}
                >
                  {quickActions.map((item) => (
                    <Button
                      key={item.label}
                      size="small"
                      onClick={item.action}
                    >
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
                      return info.originNode;
                    }
                    return (
                      <div className={styles.cellWithMark}>
                        {info.originNode}
                        <span className={styles.markDot} />
                      </div>
                    );
                  }}
                />
              </Card>
            </div>
            <div className={styles.dayBlock}>
              <Card
                title={`Selected day: ${formatDate(selectedDate)}`}
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
                      <Tag color="green">Day complete</Tag>
                    ) : (
                      <Tag>Day incomplete</Tag>
                    )}
                    <Tag
                      color={
                        status?.hasWeightMorning && status?.hasWeightEvening
                          ? "green"
                          : "default"
                      }
                    >
                      Weight:{" "}
                      {status?.hasWeightMorning ? "M" : "-"} /{" "}
                      {status?.hasWeightEvening ? "E" : "-"}
                    </Tag>
                    <Tag
                      color={workoutsComplete ? "green" : "orange"}
                    >
                      Workouts: {status?.workoutsWithFullReport ?? 0}/
                      {status?.workoutsTotal ?? 0}
                    </Tag>
                  </div>

                  <Card type="inner" title="Weight">
                    <div className={styles.weightGrid}>
                      <div className={styles.weightRow}>
                        <Input
                          value={weightForm.morning}
                          placeholder="Morning weight"
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
                          Save
                        </Button>
                      </div>
                      <div className={styles.weightRow}>
                        <Input
                          value={weightForm.evening}
                          placeholder="Evening weight"
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
                          Save
                        </Button>
                      </div>
                    </div>
                  </Card>

                  <Card type="inner" title="Workouts">
                    {dayData?.planEntries.length ? (
                      <Space direction="vertical" size="middle">
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
                                  {isComplete ? "Complete" : "Missing"}
                                </Tag>
                              </div>
                              <div className={styles.workoutInputs}>
                                <Input
                                  value={form?.startTime ?? ""}
                                  placeholder="Start time (HH:MM)"
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
                                  placeholder="Result"
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
                                  placeholder="Comment"
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
                                  Save report
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </Space>
                    ) : (
                      <Typography.Text type="secondary">
                        No workouts planned for this date.
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
