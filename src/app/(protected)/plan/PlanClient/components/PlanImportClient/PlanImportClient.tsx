"use client";

import { ArrowLeftOutlined, CloudUploadOutlined, InboxOutlined } from "@ant-design/icons";
import { Button, Card, Space, Upload, message } from "antd";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { PLAN_TEXT } from "../../constants/planText";
import { usePlanImport } from "../../hooks/usePlanImport";
import { PlanImportResult } from "../PlanImportResult/PlanImportResult";
import styles from "./PlanImportClient.module.scss";

const { Dragger } = Upload;

export function PlanImportClient() {
  const [msgApi, contextHolder] = message.useMessage();
  const { fileList, loading, result, handleFileChange, handleFileRemove, handleUpload } =
    usePlanImport({ msgApi });

  return (
    <main className={styles.mainContainer}>
      {contextHolder}
      <Card className={styles.cardStyle}>
        <Space orientation="vertical" size="large" className={styles.spaceStyle}>
          <PageHeader
            title={PLAN_TEXT.importPage.title}
            subtitle={PLAN_TEXT.importPage.description}
            actions={
              <Link href="/plan" passHref>
                <Button icon={<ArrowLeftOutlined />}>{PLAN_TEXT.actions.backToPlan}</Button>
              </Link>
            }
          />
          <Dragger
            name="file"
            maxCount={1}
            accept=".xlsx,.xls"
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
            <p className="ant-upload-text">{PLAN_TEXT.importPage.dragText}</p>
            <p className="ant-upload-hint">{PLAN_TEXT.importPage.dragHint}</p>
          </Dragger>
          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            onClick={handleUpload}
            loading={loading}
            disabled={!fileList.length}
          >
            {PLAN_TEXT.actions.upload}
          </Button>
          {result ? <PlanImportResult result={result} /> : null}
        </Space>
      </Card>
    </main>
  );
}
