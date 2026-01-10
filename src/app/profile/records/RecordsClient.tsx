"use client";

import { useEffect, useState } from "react";
import { Alert, App, Button, Card, Input, Typography } from "antd";
import styles from "./records.module.scss";
import {
  MAX_PROTOCOL_URL_LENGTH,
  MAX_RACE_CITY_LENGTH,
  MAX_RACE_NAME_LENGTH,
  PERSONAL_RECORD_DISTANCES,
  PERSONAL_RECORD_TIME_REGEX,
  type PersonalRecordDistanceKey,
} from "@/lib/personalRecords.constants";

type ApiRecord = {
  distanceKey: string;
  timeText: string;
  recordDate: string;
  protocolUrl: string | null;
  raceName: string | null;
  raceCity: string | null;
};

type RecordRow = {
  distanceKey: PersonalRecordDistanceKey;
  label: string;
  timeText: string;
  recordDate: string;
  protocolUrl: string;
  raceName: string;
  raceCity: string;
};

type RecordFieldErrors = {
  time?: boolean;
  date?: boolean;
  url?: boolean;
  raceName?: boolean;
  raceCity?: boolean;
};

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const labels = {
  title: "Мои рекорды",
  subtitle: "Заполните дистанции, по которым у вас есть рекорды. Остальные можно оставить пустыми.",
  alertTitle: "Как заполнять",
  alertText:
    "Формат времени: ЧЧ:ММ:СС или ЧЧ:ММ:СС.СС. Если время указано, дата обязательна. Пустое время удаляет запись при сохранении.",
  distanceLabel: "Дистанция",
  timeLabel: "Время",
  dateLabel: "Дата",
  raceNameLabel: "Название забега",
  raceCityLabel: "Город",
  protocolLabel: "Ссылка на протокол",
  timePlaceholder: "00:00:00.00",
  datePlaceholder: "ГГГГ-ММ-ДД",
  raceNamePlaceholder: "Название забега",
  raceCityPlaceholder: "Город",
  protocolPlaceholder: "https://",
  saveButton: "Сохранить",
  loadingText: "Загрузка...",
  loadFail: "Не удалось загрузить рекорды.",
  saveOk: "Рекорды сохранены.",
  saveFail: "Не удалось сохранить рекорды.",
  invalidTime: "Проверьте формат времени.",
  invalidDate: "Укажите корректную дату для заполненных записей.",
  invalidUrl: "Ссылка на протокол слишком длинная.",
  invalidRaceName: "Название забега не должно превышать 255 символов.",
  invalidRaceCity: "Город не должен превышать 255 символов.",
} as const;

const buildDefaultRows = (): RecordRow[] =>
  PERSONAL_RECORD_DISTANCES.map((distance) => ({
    distanceKey: distance.key,
    label: distance.label,
    timeText: "",
    recordDate: "",
    protocolUrl: "",
    raceName: "",
    raceCity: "",
  }));

const normalizeTimeText = (value: string) => value.trim().replace(",", ".");

const getRecordsFromResponse = (data: unknown): ApiRecord[] => {
  if (!data || typeof data !== "object") {
    return [];
  }
  const value = (data as { records?: unknown }).records;
  if (!Array.isArray(value)) {
    return [];
  }
  return value as ApiRecord[];
};

const mapRecordsToRows = (records: ApiRecord[]): RecordRow[] => {
  const recordMap = new Map<string, ApiRecord>();
  for (const record of records) {
    if (!record || typeof record !== "object") {
      continue;
    }
    if (typeof record.distanceKey !== "string") {
      continue;
    }
    recordMap.set(record.distanceKey, record);
  }
  return PERSONAL_RECORD_DISTANCES.map((distance) => {
    const record = recordMap.get(distance.key);
    return {
      distanceKey: distance.key,
      label: distance.label,
      timeText: record?.timeText ? String(record.timeText) : "",
      recordDate: record?.recordDate ? String(record.recordDate) : "",
      protocolUrl: record?.protocolUrl ? String(record.protocolUrl) : "",
      raceName: record?.raceName ? String(record.raceName) : "",
      raceCity: record?.raceCity ? String(record.raceCity) : "",
    };
  });
};

const validateRows = (rows: RecordRow[]) => {
  const errors: Record<string, RecordFieldErrors> = {};
  let hasTimeError = false;
  let hasDateError = false;
  let hasUrlError = false;
  let hasRaceNameError = false;
  let hasRaceCityError = false;

  for (const row of rows) {
    const normalizedTime = normalizeTimeText(row.timeText);
    const recordDate = row.recordDate.trim();
    const protocolUrl = row.protocolUrl.trim();
    const raceName = row.raceName.trim();
    const raceCity = row.raceCity.trim();
    const rowErrors: RecordFieldErrors = {};

    if (normalizedTime) {
      if (!PERSONAL_RECORD_TIME_REGEX.test(normalizedTime)) {
        rowErrors.time = true;
        hasTimeError = true;
      }
      if (!recordDate || !DATE_REGEX.test(recordDate)) {
        rowErrors.date = true;
        hasDateError = true;
      }
    }

    if (protocolUrl && protocolUrl.length > MAX_PROTOCOL_URL_LENGTH) {
      rowErrors.url = true;
      hasUrlError = true;
    }
    if (raceName && raceName.length > MAX_RACE_NAME_LENGTH) {
      rowErrors.raceName = true;
      hasRaceNameError = true;
    }
    if (raceCity && raceCity.length > MAX_RACE_CITY_LENGTH) {
      rowErrors.raceCity = true;
      hasRaceCityError = true;
    }

    if (
      rowErrors.time ||
      rowErrors.date ||
      rowErrors.url ||
      rowErrors.raceName ||
      rowErrors.raceCity
    ) {
      errors[row.distanceKey] = rowErrors;
    }
  }

  return {
    errors,
    hasTimeError,
    hasDateError,
    hasUrlError,
    hasRaceNameError,
    hasRaceCityError,
  };
};

export function RecordsClient() {
  const { message: messageApi } = App.useApp();
  const [rows, setRows] = useState<RecordRow[]>(() => buildDefaultRows());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, RecordFieldErrors>>({});

  const loadRecords = async (showError = true) => {
    setLoading(true);
    try {
      const res = await fetch("/api/personal-records", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (showError) {
          messageApi.error(labels.loadFail);
        }
        setRows(buildDefaultRows());
        return;
      }
      const records = getRecordsFromResponse(data);
      setRows(mapRecordsToRows(records));
    } catch (error) {
      if (showError) {
        messageApi.error(labels.loadFail);
      }
      console.error(error);
      setRows(buildDefaultRows());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRecords(false);
  }, []);

  const handleFieldChange = (distanceKey: PersonalRecordDistanceKey, patch: Partial<RecordRow>) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.distanceKey === distanceKey) {
          return { ...row, ...patch };
        }
        return row;
      })
    );
    setErrors({});
  };

  const handleSave = async () => {
    const validation = validateRows(rows);
    if (
      validation.hasTimeError ||
      validation.hasDateError ||
      validation.hasUrlError ||
      validation.hasRaceNameError ||
      validation.hasRaceCityError
    ) {
      setErrors(validation.errors);
      if (validation.hasTimeError) {
        messageApi.error(labels.invalidTime);
      } else if (validation.hasDateError) {
        messageApi.error(labels.invalidDate);
      } else if (validation.hasUrlError) {
        messageApi.error(labels.invalidUrl);
      } else if (validation.hasRaceNameError) {
        messageApi.error(labels.invalidRaceName);
      } else if (validation.hasRaceCityError) {
        messageApi.error(labels.invalidRaceCity);
      }
      return;
    }

    const payload = rows.map((row) => {
      const normalizedTime = normalizeTimeText(row.timeText);
      const recordDate = row.recordDate.trim();
      const protocolUrl = row.protocolUrl.trim();
      const raceName = row.raceName.trim();
      const raceCity = row.raceCity.trim();
      return {
        distanceKey: row.distanceKey,
        timeText: normalizedTime,
        recordDate: normalizedTime ? recordDate : null,
        protocolUrl: normalizedTime ? protocolUrl || null : null,
        raceName: normalizedTime ? raceName || null : null,
        raceCity: normalizedTime ? raceCity || null : null,
      };
    });

    setSaving(true);
    try {
      const res = await fetch("/api/personal-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: payload }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        messageApi.error(labels.saveFail);
        return;
      }
      const records = getRecordsFromResponse(data);
      setRows(mapRecordsToRows(records));
      setErrors({});
      messageApi.success(labels.saveOk);
    } catch (error) {
      messageApi.error(labels.saveFail);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className={styles.page}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Typography.Title level={3} className={styles.title}>
            {labels.title}
          </Typography.Title>
          <Typography.Paragraph type="secondary" className={styles.subtitle}>
            {labels.subtitle}
          </Typography.Paragraph>
        </div>

        <Alert
          type="info"
          title={labels.alertTitle}
          description={labels.alertText}
          showIcon
          className={styles.alert}
        />

        <div className={styles.grid}>
          <div className={styles.gridHeader}>
            <Typography.Text type="secondary" className={styles.gridLabel}>
              {labels.distanceLabel}
            </Typography.Text>
            <Typography.Text type="secondary" className={styles.gridLabel}>
              {labels.timeLabel}
            </Typography.Text>
            <Typography.Text type="secondary" className={styles.gridLabel}>
              {labels.dateLabel}
            </Typography.Text>
            <Typography.Text type="secondary" className={styles.gridLabel}>
              {labels.raceNameLabel}
            </Typography.Text>
            <Typography.Text type="secondary" className={styles.gridLabel}>
              {labels.raceCityLabel}
            </Typography.Text>
            <Typography.Text type="secondary" className={styles.gridLabel}>
              {labels.protocolLabel}
            </Typography.Text>
          </div>

          {loading ? (
            <Typography.Text type="secondary">{labels.loadingText}</Typography.Text>
          ) : (
            <div className={styles.rows}>
              {rows.map((row) => {
                const rowErrors = errors[row.distanceKey];
                const timeStatus = rowErrors?.time ? "error" : "";
                const dateStatus = rowErrors?.date ? "error" : "";
                const urlStatus = rowErrors?.url ? "error" : "";
                const raceNameStatus = rowErrors?.raceName ? "error" : "";
                const raceCityStatus = rowErrors?.raceCity ? "error" : "";
                return (
                  <div className={styles.row} key={row.distanceKey}>
                    <div className={styles.distance}>
                      <Typography.Text>{row.label}</Typography.Text>
                    </div>
                    <div className={styles.field}>
                      <Typography.Text className={styles.fieldLabel}>
                        {labels.timeLabel}
                      </Typography.Text>
                      <Input
                        value={row.timeText}
                        onChange={(event) => {
                          handleFieldChange(row.distanceKey, {
                            timeText: event.target.value,
                          });
                        }}
                        placeholder={labels.timePlaceholder}
                        status={timeStatus}
                        disabled={saving}
                        maxLength={16}
                        inputMode="numeric"
                      />
                    </div>
                    <div className={styles.field}>
                      <Typography.Text className={styles.fieldLabel}>
                        {labels.dateLabel}
                      </Typography.Text>
                      <Input
                        value={row.recordDate}
                        onChange={(event) => {
                          handleFieldChange(row.distanceKey, {
                            recordDate: event.target.value,
                          });
                        }}
                        placeholder={labels.datePlaceholder}
                        status={dateStatus}
                        disabled={saving}
                        type="date"
                      />
                    </div>
                    <div className={styles.field}>
                      <Typography.Text className={styles.fieldLabel}>
                        {labels.raceNameLabel}
                      </Typography.Text>
                      <Input
                        value={row.raceName}
                        onChange={(event) => {
                          handleFieldChange(row.distanceKey, {
                            raceName: event.target.value,
                          });
                        }}
                        placeholder={labels.raceNamePlaceholder}
                        status={raceNameStatus}
                        disabled={saving}
                        maxLength={MAX_RACE_NAME_LENGTH}
                      />
                    </div>
                    <div className={styles.field}>
                      <Typography.Text className={styles.fieldLabel}>
                        {labels.raceCityLabel}
                      </Typography.Text>
                      <Input
                        value={row.raceCity}
                        onChange={(event) => {
                          handleFieldChange(row.distanceKey, {
                            raceCity: event.target.value,
                          });
                        }}
                        placeholder={labels.raceCityPlaceholder}
                        status={raceCityStatus}
                        disabled={saving}
                        maxLength={MAX_RACE_CITY_LENGTH}
                      />
                    </div>
                    <div className={styles.field}>
                      <Typography.Text className={styles.fieldLabel}>
                        {labels.protocolLabel}
                      </Typography.Text>
                      <Input
                        value={row.protocolUrl}
                        onChange={(event) => {
                          handleFieldChange(row.distanceKey, {
                            protocolUrl: event.target.value,
                          });
                        }}
                        placeholder={labels.protocolPlaceholder}
                        status={urlStatus}
                        disabled={saving}
                        type="url"
                        maxLength={MAX_PROTOCOL_URL_LENGTH}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <Button type="primary" onClick={handleSave} loading={saving} disabled={loading || saving}>
            {labels.saveButton}
          </Button>
        </div>
      </Card>
    </main>
  );
}
