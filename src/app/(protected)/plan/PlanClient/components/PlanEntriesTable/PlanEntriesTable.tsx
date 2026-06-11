import { BookOutlined, CheckCircleOutlined, EditOutlined, SwapOutlined } from "@ant-design/icons";
import { Button, Empty, Pagination, Spin, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useMemo, type HTMLAttributes } from "react";
import { PLAN_PAGE_SIZE } from "../../constants/planConstants";
import { PLAN_TEXT } from "../../constants/planText";
import type { PlanDayEntry } from "../../types/planTypes";
import { formatDateWithWeekday } from "../../utils/planUtils";
import { PlanDayCard } from "../PlanDayCard/PlanDayCard";
import styles from "./PlanEntriesTable.module.scss";

type PlanEntriesTableProps = {
  entries: PlanDayEntry[];
  loading: boolean;
  currentPage: number;
  onPageChange: (page: number) => void;
  onEditDay: (date: string) => void;
  onShiftPlanFromDate: (date: string) => void;
  today: string;
};

export function PlanEntriesTable({
  entries,
  loading,
  currentPage,
  onPageChange,
  onEditDay,
  onShiftPlanFromDate,
  today,
}: PlanEntriesTableProps) {
  const columns: ColumnsType<PlanDayEntry> = useMemo(
    () => [
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
        title: PLAN_TEXT.table.actions,
        key: "actions",
        width: 152,
        onHeaderCell: () => ({ className: styles.actionsHeaderCell }),
        render: (_, record) => (
          <div className={styles.tableActions}>
            <Tooltip title={PLAN_TEXT.table.editTooltip}>
              <Button
                size="small"
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEditDay(record.date)}
                aria-label={PLAN_TEXT.table.editAria(record.date)}
              />
            </Tooltip>
            <Tooltip title={PLAN_TEXT.table.shiftTooltip}>
              <Button
                size="small"
                type="text"
                icon={<SwapOutlined />}
                onClick={() => onShiftPlanFromDate(record.date)}
                aria-label={PLAN_TEXT.table.shiftAria(record.date)}
              />
            </Tooltip>
            <Tooltip title={PLAN_TEXT.table.diaryTooltip}>
              <Link
                href={`/diary?date=${record.date}`}
                passHref
                aria-label={PLAN_TEXT.table.diaryAria(record.date)}
              >
                <Button
                  size="small"
                  type="text"
                  icon={<BookOutlined />}
                  aria-label={PLAN_TEXT.table.diaryAria(record.date)}
                />
              </Link>
            </Tooltip>
          </div>
        ),
      },
    ],
    [onEditDay, onShiftPlanFromDate]
  );

  const pagedEntries = useMemo(() => {
    const pageStart = (currentPage - 1) * PLAN_PAGE_SIZE;
    return entries.slice(pageStart, pageStart + PLAN_PAGE_SIZE);
  }, [currentPage, entries]);

  return (
    <div className={styles.planEntries}>
      <Table
        size="small"
        className={`${styles.planTable} ${styles.desktopPlanTable}`}
        tableLayout="fixed"
        columns={columns}
        dataSource={entries}
        loading={loading}
        rowKey="date"
        scroll={{ x: 940 }}
        onRow={(record) =>
          ({
            "data-plan-entry-key": record.date,
          }) as HTMLAttributes<HTMLTableRowElement>
        }
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
          showSizeChanger: false,
        }}
      />
      <div className={styles.mobilePlanList}>
        {loading ? (
          <div className={styles.mobileLoading}>
            <Spin />
          </div>
        ) : entries.length ? (
          <>
            <div className={styles.mobileCards}>
              {pagedEntries.map((entry) => (
                <PlanDayCard
                  key={entry.date}
                  entry={entry}
                  isToday={entry.date === today}
                  onEditDay={onEditDay}
                  onShiftPlanFromDate={onShiftPlanFromDate}
                />
              ))}
            </div>
            <Pagination
              size="small"
              responsive
              hideOnSinglePage
              className={styles.mobilePagination}
              pageSize={PLAN_PAGE_SIZE}
              current={currentPage}
              total={entries.length}
              showSizeChanger={false}
              onChange={onPageChange}
            />
          </>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    </div>
  );
}
