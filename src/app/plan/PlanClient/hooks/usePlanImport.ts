import { useState } from "react";
import type { MessageInstance } from "antd/es/message/interface";
import { PLAN_TEXT } from "../constants/planText";
import type { PlanImportFile, PlanImportResult } from "../types/planTypes";

type UsePlanImportParams = {
  msgApi: MessageInstance;
};

type UsePlanImportResult = {
  fileList: PlanImportFile[];
  loading: boolean;
  result: PlanImportResult | null;
  handleFileChange: (nextFileList: PlanImportFile[]) => void;
  handleFileRemove: () => boolean;
  handleUpload: () => Promise<void>;
};

export const usePlanImport = ({ msgApi }: UsePlanImportParams): UsePlanImportResult => {
  const [fileList, setFileList] = useState<PlanImportFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlanImportResult | null>(null);

  const handleFileChange = (nextFileList: PlanImportFile[]) => {
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
      msgApi.error(PLAN_TEXT.messages.fileRequired);
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file, selected?.name ?? file.name ?? "plan.xlsx");

      const response = await fetch("/api/plans/import", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => null)) as PlanImportResult | null;

      if (!response.ok || !data) {
        msgApi.error(data?.error ?? PLAN_TEXT.messages.importFailed);
        return;
      }

      setResult(data);

      if (data.errors && data.errors.length > 0) {
        msgApi.warning(PLAN_TEXT.messages.importWithErrors(data.inserted, data.errors.length));
        return;
      }

      msgApi.success(PLAN_TEXT.messages.importSuccess(data.inserted));
    } catch (error) {
      console.error(error);
      msgApi.error(PLAN_TEXT.messages.importRequestError);
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
