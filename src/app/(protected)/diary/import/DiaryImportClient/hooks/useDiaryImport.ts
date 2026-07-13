import { useRef, useState } from "react";
import type { MessageInstance } from "antd/es/message/interface";
import { DIARY_IMPORT_TEXT } from "../constants/diaryImportConstants";
import type { DiaryImportFile, DiaryImportResult } from "../types/diaryImportTypes";

type UseDiaryImportParams = {
  messageApi: MessageInstance;
};

type UseDiaryImportResult = {
  fileList: DiaryImportFile[];
  fileError: string | null;
  loading: boolean;
  result: DiaryImportResult | null;
  handleFileChange: (nextFileList: DiaryImportFile[]) => void;
  handleFileRemove: () => boolean;
  handleUpload: () => Promise<void>;
};

export const useDiaryImport = ({ messageApi }: UseDiaryImportParams): UseDiaryImportResult => {
  const [fileList, setFileList] = useState<DiaryImportFile[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiaryImportResult | null>(null);
  const uploadInProgressRef = useRef(false);

  const handleFileChange = (nextFileList: DiaryImportFile[]) => {
    setFileList(nextFileList.slice(-1));
    setFileError(null);
    setResult(null);
  };

  const handleFileRemove = () => {
    setFileList([]);
    setFileError(null);
    setResult(null);
    return true;
  };

  const handleUpload = async () => {
    if (uploadInProgressRef.current) {
      return;
    }

    const selected = fileList[0];
    const file = selected?.originFileObj as File | undefined;

    if (!file) {
      setFileError(DIARY_IMPORT_TEXT.messages.fileRequired);
      messageApi.error(DIARY_IMPORT_TEXT.messages.fileRequired);
      return;
    }

    uploadInProgressRef.current = true;
    setFileError(null);
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
        const errorMessage = data?.error ?? DIARY_IMPORT_TEXT.messages.importFailed;
        setResult(data ?? { error: errorMessage });
        messageApi.error(errorMessage);
        return;
      }

      setResult(data);
      const warningsCount = (data.warnings?.length ?? 0) + (data.errors?.length ?? 0);
      if (warningsCount > 0) {
        messageApi.warning(
          DIARY_IMPORT_TEXT.messages.importWithWarnings(data.reportsUpserted ?? 0, warningsCount)
        );
        return;
      }

      if ((data.parsedRows ?? 0) === 0) {
        messageApi.warning(DIARY_IMPORT_TEXT.messages.importEmpty);
        return;
      }

      messageApi.success(DIARY_IMPORT_TEXT.messages.importSuccess(data.reportsUpserted ?? 0));
    } catch (error) {
      console.error(error);
      setResult({ error: DIARY_IMPORT_TEXT.messages.importRequestError });
      messageApi.error(DIARY_IMPORT_TEXT.messages.importRequestError);
    } finally {
      uploadInProgressRef.current = false;
      setLoading(false);
    }
  };

  return {
    fileList,
    fileError,
    loading,
    result,
    handleFileChange,
    handleFileRemove,
    handleUpload,
  };
};
