"use client";

import { useCallback, useEffect, useState } from "react";
import type { MessageInstance } from "antd/es/message/interface";
import type { PersonalRecordDistanceKey } from "@/shared/constants/personalRecords.constants";
import { RECORDS_LABELS } from "../constants/recordsConstants";
import type { RecordFieldErrors, RecordRow } from "../types/recordsTypes";
import {
  buildDefaultRows,
  buildRecordsPayload,
  getRecordsFromResponse,
  mapRecordsToRows,
  validateRows,
} from "../utils/recordsUtils";

type UseRecordsParams = {
  apiUrl: string;
  messageApi: MessageInstance;
};

export const useRecords = ({ apiUrl, messageApi }: UseRecordsParams) => {
  const [rows, setRows] = useState<RecordRow[]>(() => buildDefaultRows());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, RecordFieldErrors>>({});

  const loadRecords = useCallback(
    async (showError = true) => {
      setLoading(true);
      try {
        const response = await fetch(apiUrl, { cache: "no-store" });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          if (showError) {
            messageApi.error(RECORDS_LABELS.loadFail);
          }
          setRows(buildDefaultRows());
          return;
        }

        const records = getRecordsFromResponse(data);
        setRows(mapRecordsToRows(records));
      } catch (error) {
        if (showError) {
          messageApi.error(RECORDS_LABELS.loadFail);
        }
        console.error(error);
        setRows(buildDefaultRows());
      } finally {
        setLoading(false);
      }
    },
    [apiUrl, messageApi]
  );

  useEffect(() => {
    void loadRecords(false);
  }, [loadRecords]);

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
        messageApi.error(RECORDS_LABELS.invalidTime);
      } else if (validation.hasDateError) {
        messageApi.error(RECORDS_LABELS.invalidDate);
      } else if (validation.hasUrlError) {
        messageApi.error(RECORDS_LABELS.invalidUrl);
      } else if (validation.hasRaceNameError) {
        messageApi.error(RECORDS_LABELS.invalidRaceName);
      } else if (validation.hasRaceCityError) {
        messageApi.error(RECORDS_LABELS.invalidRaceCity);
      }

      return;
    }

    setSaving(true);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: buildRecordsPayload(rows) }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        messageApi.error(RECORDS_LABELS.saveFail);
        return;
      }

      const records = getRecordsFromResponse(data);
      setRows(mapRecordsToRows(records));
      setErrors({});
      messageApi.success(RECORDS_LABELS.saveOk);
    } catch (error) {
      messageApi.error(RECORDS_LABELS.saveFail);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return {
    rows,
    loading,
    saving,
    errors,
    handleFieldChange,
    handleSave,
  };
};
