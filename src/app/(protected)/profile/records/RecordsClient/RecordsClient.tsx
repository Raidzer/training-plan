"use client";

import { App } from "antd";
import { useEffect, useRef, useState } from "react";
import type { PersonalRecordDistanceKey } from "@/shared/constants/personalRecords.constants";
import { RecordEditor } from "./components/RecordEditor/RecordEditor";
import { RecordsErrorState } from "./components/RecordsErrorState/RecordsErrorState";
import { RecordsHeader } from "./components/RecordsHeader/RecordsHeader";
import { RecordsLoadingState } from "./components/RecordsLoadingState/RecordsLoadingState";
import { RecordsNavigator } from "./components/RecordsNavigator/RecordsNavigator";
import { RecordsOverview } from "./components/RecordsOverview/RecordsOverview";
import { DEFAULT_SELECTED_DISTANCE_KEY } from "./constants/recordsConstants";
import { useRecords } from "./hooks/useRecords";
import type { RecordsClientProps } from "./types/recordsTypes";
import { isRecordFilled } from "./utils/recordsUtils";
import styles from "./RecordsClient.module.scss";

export function RecordsClient({
  apiUrl = "/api/personal-records",
  variant = "profile",
}: RecordsClientProps) {
  const { message: messageApi } = App.useApp();
  const [selectedDistanceKey, setSelectedDistanceKey] = useState<PersonalRecordDistanceKey>(
    DEFAULT_SELECTED_DISTANCE_KEY
  );
  const initialSelectionSetRef = useRef(false);
  const {
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
  } = useRecords({ apiUrl, messageApi });

  useEffect(() => {
    if (initialSelectionSetRef.current || loading || loadError) {
      return;
    }

    const firstFilledRow = rows.find(isRecordFilled);
    setSelectedDistanceKey(firstFilledRow?.distanceKey ?? DEFAULT_SELECTED_DISTANCE_KEY);
    initialSelectionSetRef.current = true;
  }, [loadError, loading, rows]);

  const selectedRow =
    rows.find((row) => row.distanceKey === selectedDistanceKey) ?? rows[0] ?? null;

  const handleSubmit = async () => {
    const result = await handleSave();

    if (result.status === "invalid") {
      setSelectedDistanceKey(result.invalidDistanceKey);
    }
  };

  return (
    <div className={styles.page}>
      {variant === "profile" ? <RecordsHeader /> : null}
      <RecordsOverview rows={rows} loading={loading} loadError={loadError} />

      {loading ? <RecordsLoadingState /> : null}

      {!loading && loadError ? <RecordsErrorState loading={loading} onRetry={handleRetry} /> : null}

      {!loading && !loadError && selectedRow ? (
        <div className={styles.workspace}>
          <div className={styles.navigatorColumn}>
            <RecordsNavigator
              rows={rows}
              selectedDistanceKey={selectedDistanceKey}
              errors={errors}
              disabled={saving}
              onSelect={setSelectedDistanceKey}
            />
          </div>
          <RecordEditor
            row={selectedRow}
            errors={errors[selectedRow.distanceKey] ?? {}}
            saving={saving}
            disabled={loading || loadError}
            hasChanges={hasChanges}
            saveError={saveError}
            validationAttempt={validationAttempt}
            onFieldChange={handleFieldChange}
            onClearRecord={handleClearRecord}
            onSubmit={handleSubmit}
          />
        </div>
      ) : null}
    </div>
  );
}
