import { BookOutlined, CheckCircleOutlined, EditOutlined, FireOutlined } from "@ant-design/icons";
import { Button, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useMemo } from "react";
import { PLAN_PAGE_SIZE } from "../planConstants";
import { PLAN_TEXT } from "../planText";
import { formatDateWithWeekday, type PlanDayEntry } from "../planUtils";
import styles from "../plan.module.scss";

type PlanEntriesTableProps = {
  entries: PlanDayEntry[];
  loading: boolean;
  currentPage: number;
  onPageChange: (page: number) => void;
  onEditDay: (date: string) => void;
  today: string;
};

export function PlanEntriesTable({
  entries,
  loading,
  currentPage,
  onPageChange,
  onEditDay,
  today,
}: PlanEntriesTableProps) {
  const columns: ColumnsType<PlanDayEntry> = useMemo(
    () => [
      {
        title: PLAN_TEXT.table.workload,
        dataIndex: "isWorkload",
        width: 120,
        render: (value: boolean) =>
          value ? (
            <Tag icon={<FireOutlined />} color="volcano">
              {PLAN_TEXT.table.workloadTag}
            </Tag>
          ) : null,
      },
      {
        title: PLAN_TEXT.table.date,
        dataIndex: "date",
        width: 120,
        render: (value: string) => formatDateWithWeekday(value),
      },
      {
        title: PLAN_TEXT.table.task,
        dataIndex: "taskText",
        className: styles.textColumn,
        onHeaderCell: () => ({ className: styles.textColumn }),
        render: (value: string) => (
          <span className={styles.multilineText} dangerouslySetInnerHTML={{ __html: value }} />
        ),
      },
      {
        title: PLAN_TEXT.table.comment,
        dataIndex: "commentText",
        className: styles.textColumn,
        onHeaderCell: () => ({ className: styles.textColumn }),
        render: (value: string | null) =>
          value ? (
            <span className={styles.multilineText} dangerouslySetInnerHTML={{ __html: value }} />
          ) : null,
      },
      {
        title: PLAN_TEXT.table.report,
        dataIndex: "hasReport",
        width: 120,
        render: (value: boolean) =>
          value ? (
            <Tag icon={<CheckCircleOutlined />} color="green">
              {PLAN_TEXT.table.reportTag}
            </Tag>
          ) : null,
      },
      {
        title: PLAN_TEXT.table.editColumnTitle,
        key: "edit",
        width: 64,
        render: (_, record) => (
          <Tooltip title={PLAN_TEXT.table.editTooltip}>
            <Button
              size="small"
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEditDay(record.date)}
              aria-label={PLAN_TEXT.table.editAria(record.date)}
            />
          </Tooltip>
        ),
      },
      {
        title: PLAN_TEXT.table.diary,
        key: "diary",
        width: 64,
        render: (_, record) => (
          <Tooltip title={PLAN_TEXT.table.diaryTooltip}>
            <Link href={`/diary?date=${record.date}`} passHref>
              <Button
                size="small"
                type="text"
                icon={<BookOutlined />}
                aria-label={PLAN_TEXT.table.diaryAria(record.date)}
              />
            </Link>
          </Tooltip>
        ),
      },
    ],
    [onEditDay]
  );

  return (
    <Table
      size="small"
      className={styles.planTable}
      tableLayout="fixed"
      columns={columns}
      dataSource={entries}
      loading={loading}
      rowKey="date"
      rowClassName={(record) => {
        const rowClasses = [];
        if (record.isWorkload) {
          rowClasses.push(styles.workloadRow);
        }
        if (record.date === today) {
          rowClasses.push(styles.todayRow);
        }
        return rowClasses.join(" ");
      }}
      pagination={{
        pageSize: PLAN_PAGE_SIZE,
        current: currentPage,
        onChange: (page) => onPageChange(page),
      }}
    />
  );
}
