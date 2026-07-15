"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MessageInstance } from "antd/es/message/interface";
import type { PersonalRecordDistanceKey } from "@/shared/constants/personalRecords.constants";
import { RECORDS_LABELS } from "../constants/recordsConstants";
import type {
  ApiRecord,
  RecordFieldErrors,
  RecordRow,
  RecordSaveResult,
} from "../types/recordsTypes";
import {
  buildDefaultRows,
  buildRecordsPayload,
  clearChangedFieldErrors,
  clearRecordRow,
  getFirstInvalidDistanceKey,
  getRecordsFromResponse,
  mapRecordsToRows,
  validateRows,
} from "../utils/recordsUtils";

type UseRecordsParams = {
  apiUrl: string;
  messageApi: MessageInstance;
};

type RecordsValidation = ReturnType<typeof validateRows>;
const fetchRecordsFromApi = async (apiUrl: string): Promise<ApiRecord[] | null> => {
  const response = await fetch(apiUrl, { cache: "no-store" });
  const data = await response.json().catch(() => null);
  const records = getRecordsFromResponse(data);

  if (!response.ok || records === null) {
    return null;
  }

  return records;
};

const getValidationMessage = (validation: RecordsValidation) => {
  if (validation.hasTimeError) {
    return RECORDS_LABELS.invalidTime;
  }

  if (validation.hasDateError) {
    return RECORDS_LABELS.invalidDate;
  }

  if (validation.hasUrlError) {
    return RECORDS_LABELS.invalidUrl;
  }

  if (validation.hasRaceNameError) {
    return RECORDS_LABELS.invalidRaceName;
  }

  if (validation.hasRaceCityError) {
    return RECORDS_LABELS.invalidRaceCity;
  }

  return null;
};

export const useRecords = ({ apiUrl, messageApi }: UseRecordsParams) => {
  const [rows, setRows] = useState<RecordRow[]>(() => buildDefaultRows());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, RecordFieldErrors>>({});
  const [saveError, setSaveError] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationAttempt, setValidationAttempt] = useState(0);
  const loadRequestIdRef = useRef(0);
  const saveRequestRef = useRef(false);

  const applyLoadedRecords = useCallback((records: ApiRecord[]) => {
    setLoadError(false);
    setRows(mapRecordsToRows(records));
    setErrors({});
    setSaveError(false);
    setHasChanges(false);
  }, []);

  useEffect(() => {
    const requestId = loadRequestIdRef.current + 1;
    loadRequestIdRef.current = requestId;

    void fetchRecordsFromApi(apiUrl)
      .then((records) => {
        if (requestId !== loadRequestIdRef.current) {
          return;
        }

        if (records === null) {
          setLoadError(true);
          return;
        }

        applyLoadedRecords(records);
      })
      .catch((error: unknown) => {
        if (requestId !== loadRequestIdRef.current) {
          return;
        }

        console.error(error);
        setLoadError(true);
      })
      .finally(() => {
        if (requestId === loadRequestIdRef.current) {
          setLoading(false);
        }
      });

    return () => {
      loadRequestIdRef.current += 1;
    };
  }, [apiUrl, applyLoadedRecords]);

  const handleRetry = useCallback(async () => {
    const requestId = loadRequestIdRef.current + 1;
    loadRequestIdRef.current = requestId;
    setLoading(true);
    setLoadError(false);
    setSaveError(false);

    try {
      const records = await fetchRecordsFromApi(apiUrl);

      if (requestId !== loadRequestIdRef.current) {
        return;
      }

      if (records === null) {
        setLoadError(true);
        return;
      }

      applyLoadedRecords(records);
    } catch (error) {
      if (requestId !== loadRequestIdRef.current) {
        return;
      }

      console.error(error);
      setLoadError(true);
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [apiUrl, applyLoadedRecords]);

  const handleFieldChange = useCallback(
    (distanceKey: PersonalRecordDistanceKey, patch: Partial<RecordRow>) => {
      setRows((currentRows) =>
        currentRows.map((row) => {
          if (row.distanceKey === distanceKey) {
            return { ...row, ...patch };
          }

          return row;
        })
      );
      setErrors((currentErrors) => clearChangedFieldErrors(currentErrors, distanceKey, patch));
      setHasChanges(true);
      setSaveError(false);
    },
    []
  );

  const handleClearRecord = useCallback((distanceKey: PersonalRecordDistanceKey) => {
    setRows((currentRows) =>
      currentRows.map((row) => {
        if (row.distanceKey === distanceKey) {
          return clearRecordRow(row);
        }

        return row;
      })
    );
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[distanceKey];
      return nextErrors;
    });
    setHasChanges(true);
    setSaveError(false);
  }, []);

  const handleSave = useCallback(async (): Promise<RecordSaveResult> => {
    if (saveRequestRef.current || loading || loadError) {
      return { status: "blocked" };
    }

    const validation = validateRows(rows);
    const validationMessage = getValidationMessage(validation);

    if (validationMessage) {
      setErrors(validation.errors);
      setValidationAttempt((currentAttempt) => currentAttempt + 1);
      messageApi.error(validationMessage);

      const invalidDistanceKey = getFirstInvalidDistanceKey(rows, validation.errors);
      if (invalidDistanceKey) {
        return { status: "invalid", invalidDistanceKey };
      }

      return { status: "blocked" };
    }

    saveRequestRef.current = true;
    setSaving(true);
    setSaveError(false);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: buildRecordsPayload(rows) }),
      });
      const data = await response.json().catch(() => null);
      const records = getRecordsFromResponse(data);

      if (!response.ok || records === null) {
        setSaveError(true);
        messageApi.error(RECORDS_LABELS.saveFail);
        return { status: "failed" };
      }

      setRows(mapRecordsToRows(records));
      setErrors({});
      setHasChanges(false);
      messageApi.success(RECORDS_LABELS.saveOk);
      return { status: "saved" };
    } catch (error) {
      setSaveError(true);
      messageApi.error(RECORDS_LABELS.saveFail);
      console.error(error);
      return { status: "failed" };
    } finally {
      saveRequestRef.current = false;
      setSaving(false);
    }
  }, [apiUrl, loadError, loading, messageApi, rows]);

  return {
    rows,
    loading,
    loadError,
    saving,
    saveError,
    hasChanges,
    errors,
    validationAttempt,
    handleFieldChange,
    handleClearRecord,
    handleSave,
    handleRetry,
  };
};
