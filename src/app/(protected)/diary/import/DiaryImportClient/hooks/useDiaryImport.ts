import { useState } from "react";
import type { MessageInstance } from "antd/es/message/interface";
import { DIARY_IMPORT_TEXT } from "../constants/diaryImportConstants";
import type { DiaryImportFile, DiaryImportResult } from "../types/diaryImportTypes";

type UseDiaryImportParams = {
  messageApi: MessageInstance;
};

type UseDiaryImportResult = {
  fileList: DiaryImportFile[];
  loading: boolean;
  result: DiaryImportResult | null;
  handleFileChange: (nextFileList: DiaryImportFile[]) => void;
  handleFileRemove: () => boolean;
  handleUpload: () => Promise<void>;
};

export const useDiaryImport = ({ messageApi }: UseDiaryImportParams): UseDiaryImportResult => {
  const [fileList, setFileList] = useState<DiaryImportFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiaryImportResult | null>(null);

  const handleFileChange = (nextFileList: DiaryImportFile[]) => {
    setFileList(nextFileList.slice(-1));
  };

  const handleFileRemove = () => {
    setFileList([]);
    return true;
  };

  const handleUpload = async () => {
    const selected = fileList[0];
    const file = selected?.originFileObj as File | undefined;

    if (!file) {
      messageApi.error(DIARY_IMPORT_TEXT.messages.fileRequired);
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file, selected?.name ?? file.name ?? "diary.xlsx");

      const response = await fetch("/api/diary/import", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => null)) as DiaryImportResult | null;

      if (!response.ok || !data) {
        messageApi.error(data?.error ?? DIARY_IMPORT_TEXT.messages.importFailed);
        return;
      }

      setResult(data);
      const warningsCount = (data.warnings?.length ?? 0) + (data.errors?.length ?? 0);
      if (warningsCount > 0) {
        messageApi.warning(
          DIARY_IMPORT_TEXT.messages.importWithWarnings(data.reportsUpserted, warningsCount)
        );
        return;
      }

      messageApi.success(DIARY_IMPORT_TEXT.messages.importSuccess(data.reportsUpserted));
    } catch (error) {
      console.error(error);
      messageApi.error(DIARY_IMPORT_TEXT.messages.importRequestError);
    } finally {
      setLoading(false);
    }
  };

  return {
    fileList,
    loading,
    result,
    handleFileChange,
    handleFileRemove,
    handleUpload,
  };
};
