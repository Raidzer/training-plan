"use client";

import { Button } from "antd";
import Link from "next/link";
import { CalendarOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/PageHeader";

type DiaryHeaderProps = {
  title: string;
  subtitle: string;
  periodHref: string;
  periodLabel: string;
  dashboardHref: string;
  dashboardLabel: string;
};

export function DiaryHeader({
  title,
  subtitle,
  periodHref,
  periodLabel,
  dashboardHref,
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
          <Link href={dashboardHref} passHref>
            <Button icon={<ArrowLeftOutlined />}>{dashboardLabel}</Button>
          </Link>
        </>
      }
    />
  );
}
