"use client";

import { Button } from "antd";
import Link from "next/link";
import { ArrowLeftOutlined, CalendarOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/PageHeader";

type DiaryHeaderProps = {
  title: string;
  subtitle: string;
  periodHref: string;
  periodLabel: string;
  onBack: () => void;
  dashboardLabel: string;
};

export function DiaryHeader({
  title,
  subtitle,
  periodHref,
  periodLabel,
  onBack,
  dashboardLabel,
}: DiaryHeaderProps) {
  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      actions={
        <>
          <Link href={periodHref} passHref>
            <Button icon={<CalendarOutlined />}>{periodLabel}</Button>
          </Link>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
            {dashboardLabel}
          </Button>
        </>
      }
    />
  );
}
