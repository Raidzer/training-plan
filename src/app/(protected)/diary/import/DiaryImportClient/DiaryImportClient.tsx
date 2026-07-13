"use client";

import { ArrowLeftOutlined, CloudUploadOutlined, InboxOutlined } from "@ant-design/icons";
import { Button, Card, Space, Upload, message } from "antd";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { DIARY_IMPORT_TEXT } from "./constants/diaryImportConstants";
import { DiaryImportResult } from "./components/DiaryImportResult/DiaryImportResult";
import { useDiaryImport } from "./hooks/useDiaryImport";
import styles from "./DiaryImportClient.module.scss";

const { Dragger } = Upload;

export function DiaryImportClient() {
  const [messageApi, contextHolder] = message.useMessage();
  const { fileList, loading, result, handleFileChange, handleFileRemove, handleUpload } =
    useDiaryImport({ messageApi });

  return (
    <main className={styles.mainContainer}>
      {contextHolder}
      <Card className={styles.cardStyle}>
        <Space orientation="vertical" size="large" className={styles.spaceStyle}>
          <PageHeader
            title={DIARY_IMPORT_TEXT.page.title}
            subtitle={DIARY_IMPORT_TEXT.page.description}
            actions={
              <Link href="/plan" passHref>
                <Button icon={<ArrowLeftOutlined />}>{DIARY_IMPORT_TEXT.actions.backToPlan}</Button>
              </Link>
            }
          />
          <Dragger
            name="file"
            maxCount={1}
            accept=".xlsx"
            beforeUpload={() => false}
            onRemove={handleFileRemove}
            onChange={(info) => {
              handleFileChange(info.fileList);
            }}
            fileList={fileList}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">{DIARY_IMPORT_TEXT.page.dragText}</p>
            <p className="ant-upload-hint">{DIARY_IMPORT_TEXT.page.dragHint}</p>
          </Dragger>
          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            onClick={handleUpload}
            loading={loading}
            disabled={!fileList.length}
          >
            {DIARY_IMPORT_TEXT.actions.upload}
          </Button>
          {result ? <DiaryImportResult result={result} /> : null}
        </Space>
      </Card>
    </main>
  );
}
