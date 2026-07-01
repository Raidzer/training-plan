import { Empty, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { COMPETITION_PRIORITIES } from "@/shared/constants/competitions";
import {
  formatCompetitionDate,
  formatCompetitionDistanceLabel,
} from "@/shared/utils/competitionUtils";
import {
  COMPETITION_PRIORITY_META,
  competitionsLabels,
} from "@/app/(protected)/profile/competitions/CompetitionsClient/constants/competitionsConstants";
import { ADMIN_USER_COMPETITIONS_LABELS } from "../../constants/adminUserCompetitionsConstants";
import type {
  AdminCompetitionBlockItem,
  AdminCompetitionItem,
} from "../../types/adminUserCompetitionsTypes";
import { formatAdminCompetitionBlockPeriod } from "../../utils/adminUserCompetitionsUtils";
import styles from "./AdminCompetitionBlocks.module.scss";

type AdminCompetitionBlocksProps = {
  blocks: AdminCompetitionBlockItem[];
};

const competitionColumns: ColumnsType<AdminCompetitionItem> = [
  {
    title: competitionsLabels.dateColumn,
    dataIndex: "date",
    width: 130,
    render: (value: string) => formatCompetitionDate(value),
  },
  {
    title: competitionsLabels.nameLocationColumn,
    dataIndex: "nameLocation",
    render: (value: string) => value,
  },
  {
    title: competitionsLabels.distanceColumn,
    dataIndex: "distanceLabel",
    width: 130,
    render: (value: string) => formatCompetitionDistanceLabel(value),
  },
  {
    title: competitionsLabels.priorityColumn,
    dataIndex: "priority",
    width: 130,
    render: (value: AdminCompetitionItem["priority"]) => {
      const meta = COMPETITION_PRIORITY_META[value];

      return <Tag color={meta.color}>{meta.label}</Tag>;
    },
  },
  {
    title: competitionsLabels.resultColumn,
    dataIndex: "result",
    width: 140,
    render: (value: string | null) => value || ADMIN_USER_COMPETITIONS_LABELS.emptyResult,
  },
];

export function AdminCompetitionBlocks({ blocks }: AdminCompetitionBlocksProps) {
  if (blocks.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={ADMIN_USER_COMPETITIONS_LABELS.emptyBlocks}
      />
    );
  }

  return (
    <section className={styles.list} aria-label={ADMIN_USER_COMPETITIONS_LABELS.blocksListAria}>
      {blocks.map((block) => (
        <article key={block.id} className={styles.block}>
          <div className={styles.blockHeader}>
            <div className={styles.blockTitleGroup}>
              <div className={styles.blockTitleLine}>
                <Typography.Title level={5} className={styles.blockTitle}>
                  {block.title}
                </Typography.Title>
                <Tag>{block.competitions.length}</Tag>
              </div>
              <Typography.Text type="secondary">
                {formatAdminCompetitionBlockPeriod(block)}
              </Typography.Text>
            </div>
          </div>

          <Table
            size="small"
            className={styles.table}
            columns={competitionColumns}
            dataSource={block.competitions}
            rowKey="id"
            pagination={false}
            tableLayout="fixed"
            scroll={{ x: 720 }}
            locale={{
              emptyText: competitionsLabels.emptyCompetitions,
            }}
            rowClassName={(record) => {
              const rowClasses: string[] = [];
              if (record.priority === COMPETITION_PRIORITIES.MAIN) {
                rowClasses.push(styles.mainCompetitionRow);
              }

              return rowClasses.join(" ");
            }}
          />
        </article>
      ))}
    </section>
  );
}
