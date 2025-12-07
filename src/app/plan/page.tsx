"use client";

import {
  Button,
  Card,
  List,
  Space,
  Typography,
  Upload,
  message,
  type UploadFile,
} from "antd";
import { InboxOutlined, CloudUploadOutlined } from "@ant-design/icons";
import { useState } from "react";
import styles from "./plan.module.scss";

const { Dragger } = Upload;

type ImportResult = {
  importId: number;
  inserted: number;
  skipped: number;
  errors?: { row: number; message: string }[];
  error?: string;
};

export default function PlanPage() {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [msgApi, contextHolder] = message.useMessage();

  const handleUpload = async () => {
    const selected = fileList[0];
    const file = selected?.originFileObj as File | undefined;
    if (!file) {
      msgApi.error("Выберите файл Excel");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file, selected?.name ?? file.name ?? "plan.xlsx");
      console.log("FormData entries:", Array.from(formData.entries()));
      const res = await fetch("/api/plans/import", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json().catch(() => null)) as ImportResult | null;
      if (!res.ok || !data) {
        msgApi.error(data?.error ?? "Не удалось загрузить план");
        return;
      }
      setResult(data);
      if (data.errors && data.errors.length > 0) {
        msgApi.warning(
          `Загружено: ${data.inserted}, пропущено: ${data.errors.length}`
        );
      } else {
        msgApi.success(`Загружено строк: ${data.inserted}`);
      }
    } catch (err) {
      console.error(err);
      msgApi.error("Ошибка запроса");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.mainContainer}>
      {contextHolder}
      <Card className={styles.cardStyle}>
        <Space
          orientation="vertical"
          size="large"
          className={styles.spaceStyle}
        >
          <div>
            <Typography.Title level={3} className={styles.typographyTitle}>
              Импорт плана из Excel
            </Typography.Title>
            <Typography.Paragraph
              type="secondary"
              className={styles.typographyParagraph}
            >
              Файл должен содержать колонки «Дата», «Задание», «Комментарий»
              (первая строка — заголовки). Используется только первый лист.
            </Typography.Paragraph>
          </div>
          <Dragger
            name="file"
            maxCount={1}
            accept=".xlsx,.xls"
            beforeUpload={() => false}
            onRemove={() => {
              setFileList([]);
              return true;
            }}
            onChange={(info) => {
              setFileList(info.fileList.slice(-1));
            }}
            fileList={fileList}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Перетащите файл сюда или кликните для выбора
            </p>
            <p className="ant-upload-hint">
              При повторной загрузке строки добавятся как новая версия (старые
              не обновляются).
            </p>
          </Dragger>
          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            onClick={handleUpload}
            loading={loading}
            disabled={!fileList.length}
          >
            Загрузить
          </Button>
          {result && (
            <Card type="inner" title="Результат импорта">
              <Typography.Paragraph style={{ marginBottom: 4 }}>
                Импорт #{result.importId}: добавлено {result.inserted},
                пропущено {result.skipped}.
              </Typography.Paragraph>
              {result.errors && result.errors.length > 0 && (
                <>
                  <Typography.Text type="danger">Ошибки строк:</Typography.Text>
                  <List
                    size="small"
                    dataSource={result.errors}
                    renderItem={(err) => (
                      <List.Item>
                        Строка {err.row}: {err.message}
                      </List.Item>
                    )}
                    style={{ marginTop: 8 }}
                  />
                </>
              )}
            </Card>
          )}
        </Space>
      </Card>
    </main>
  );
}
