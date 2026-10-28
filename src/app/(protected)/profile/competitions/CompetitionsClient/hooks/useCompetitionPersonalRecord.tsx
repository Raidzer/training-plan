"use client";

import type { App } from "antd";
import { useCallback, useEffect, useRef } from "react";
import { PERSONAL_RECORD_DISTANCES } from "@/shared/constants/personalRecords.constants";
import {
  getPersonalRecordDistanceKey,
  parsePersonalRecordTime,
} from "@/shared/utils/personalRecordUtils";
import { PersonalRecordOffer } from "../components/PersonalRecordOffer/PersonalRecordOffer";
import styles from "../components/PersonalRecordOffer/PersonalRecordOffer.module.scss";
import { personalRecordOfferLabels } from "../constants/personalRecordOfferConstants";
import type { CompetitionItem } from "../types/competitionsTypes";

type AppContextValue = ReturnType<typeof App.useApp>;

type UseCompetitionPersonalRecordParams = {
  messageApi: AppContextValue["message"];
  modalApi: AppContextValue["modal"];
};

export const useCompetitionPersonalRecord = ({
  messageApi,
  modalApi,
}: UseCompetitionPersonalRecordParams) => {
  const mountedRef = useRef(false);
  const dialogsRef = useRef(new Set<ReturnType<typeof modalApi.confirm>>());

  useEffect(() => {
    mountedRef.current = true;
    const dialogs = dialogsRef.current;

    return () => {
      mountedRef.current = false;
      dialogs.forEach((dialog) => dialog.destroy());
      dialogs.clear();
    };
  }, []);

  return useCallback(
    async (competition: CompetitionItem, previousCompetition?: CompetitionItem) => {
      const distanceKey = getPersonalRecordDistanceKey(competition.distanceLabel);
      const nextTime = parsePersonalRecordTime(competition.result ?? "");

      if (!mountedRef.current || !distanceKey || !nextTime) {
        return;
      }

      if (
        previousCompetition &&
        getPersonalRecordDistanceKey(previousCompetition.distanceLabel) === distanceKey &&
        parsePersonalRecordTime(previousCompetition.result ?? "")?.hundredths ===
          nextTime.hundredths
      ) {
        return;
      }

      try {
        const response = await fetch("/api/personal-records", { cache: "no-store" });
        const data: unknown = await response.json();

        if (!mountedRef.current) {
          return;
        }

        if (
          !response.ok ||
          !data ||
          typeof data !== "object" ||
          !("records" in data) ||
          !Array.isArray(data.records) ||
          !data.records.every(
            (record: unknown) =>
              record !== null &&
              typeof record === "object" &&
              "distanceKey" in record &&
              PERSONAL_RECORD_DISTANCES.some((distance) => distance.key === record.distanceKey) &&
              "timeText" in record &&
              typeof record.timeText === "string"
          )
        ) {
          throw new Error(personalRecordOfferLabels.loadFail);
        }

        const currentRecords = (
          data.records as Array<{ distanceKey: string; timeText: string }>
        ).filter((record) => record.distanceKey === distanceKey);

        if (currentRecords.length > 1) {
          throw new Error(personalRecordOfferLabels.loadFail);
        }

        const currentRecord = currentRecords[0];
        const currentTime = currentRecord ? parsePersonalRecordTime(currentRecord.timeText) : null;

        if (currentRecord && !currentTime) {
          messageApi.warning(personalRecordOfferLabels.invalidCurrentRecord);
          return;
        }

        if (currentTime && nextTime.hundredths >= currentTime.hundredths) {
          return;
        }

        const distance = PERSONAL_RECORD_DISTANCES.find((item) => item.key === distanceKey)!;
        const renderContent = (error: string | null = null) => (
          <PersonalRecordOffer
            distanceLabel={distance.label}
            previousTime={currentTime?.timeText ?? null}
            newTime={nextTime.timeText}
            competition={competition}
            error={error}
          />
        );
        let active = true;
        const dialog = modalApi.confirm({
          title: personalRecordOfferLabels.title,
          content: renderContent(),
          icon: null,
          className: styles.modal,
          width: 520,
          okText: currentTime
            ? personalRecordOfferLabels.updateButton
            : personalRecordOfferLabels.saveButton,
          cancelText: personalRecordOfferLabels.skipButton,
          focusable: { autoFocusButton: "cancel" },
          mask: { closable: false },
          keyboard: true,
          onCancel: () => {
            active = false;
            dialogsRef.current.delete(dialog);
          },
          afterClose: () => {
            active = false;
            dialogsRef.current.delete(dialog);
          },
          onOk: async () => {
            if (!mountedRef.current || !active) {
              return;
            }

            dialog.update({
              content: renderContent(),
              cancelButtonProps: { disabled: true },
              keyboard: false,
            });

            try {
              const saveResponse = await fetch("/api/personal-records", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  onlyIfBetter: true,
                  records: [
                    {
                      distanceKey,
                      timeText: nextTime.timeText,
                      recordDate: competition.date,
                      raceName: competition.nameLocation,
                      raceCity: null,
                      protocolUrl: null,
                    },
                  ],
                }),
              });
              const saveData = (await saveResponse.json().catch(() => null)) as {
                status?: string;
                error?: string;
              } | null;

              if (!mountedRef.current || !active) {
                return;
              }

              if (
                !saveResponse.ok ||
                !saveData ||
                !["updated", "not_better", "conflict"].includes(saveData.status ?? "")
              ) {
                const error =
                  saveData?.error === "invalid_current_record"
                    ? personalRecordOfferLabels.invalidCurrentRecord
                    : personalRecordOfferLabels.saveFail;
                throw new Error(error);
              }

              active = false;
              dialogsRef.current.delete(dialog);

              if (saveData.status === "updated") {
                messageApi.success(personalRecordOfferLabels.saveSuccess);
              } else {
                messageApi.info(
                  saveData.status === "conflict"
                    ? personalRecordOfferLabels.conflict
                    : personalRecordOfferLabels.notBetter
                );
              }
            } catch (error) {
              if (!mountedRef.current || !active) {
                return;
              }

              const message =
                error instanceof Error &&
                error.message === personalRecordOfferLabels.invalidCurrentRecord
                  ? personalRecordOfferLabels.invalidCurrentRecord
                  : personalRecordOfferLabels.saveFail;
              dialog.update({
                content: renderContent(message),
                cancelButtonProps: { disabled: false },
                keyboard: true,
              });
              throw error;
            }
          },
        });
        dialogsRef.current.add(dialog);
        // Ant Design подавляет отклонение onOk только после подписки на результат диалога.
        void dialog.then(
          () => undefined,
          () => undefined
        );
      } catch {
        if (mountedRef.current) {
          messageApi.error(personalRecordOfferLabels.loadFail);
        }
      }
    },
    [messageApi, modalApi]
  );
};
