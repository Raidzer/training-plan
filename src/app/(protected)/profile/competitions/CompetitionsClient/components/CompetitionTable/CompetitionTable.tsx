import { CloseOutlined, DeleteOutlined, EditOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, DatePicker, Input, Select, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo } from "react";
import { COMPETITION_PRIORITIES } from "@/shared/constants/competitions";
import { formatCompetitionDate } from "@/shared/utils/competitionUtils";
import {
  COMPETITION_PRIORITY_META,
  COMPETITION_PRIORITY_OPTIONS,
  COMPETITIONS_DISPLAY_DATE_FORMAT,
  competitionsLabels,
} from "../../constants/competitionsConstants";
import type { CompetitionFormState, CompetitionItem } from "../../types/competitionsTypes";
import styles from "./CompetitionTable.module.scss";

type CompetitionTableProps = {
  competitions: CompetitionItem[];
  editingCompetitionId: number | null;
  editingCompetitionForm: CompetitionFormState;
  updatingCompetitionId: number | null;
  deletingCompetitionId: number | null;
  onStartEdit: (competition: CompetitionItem) => void;
  onChangeEdit: <Key extends keyof CompetitionFormState>(
    key: Key,
    value: CompetitionFormState[Key]
  ) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (competition: CompetitionItem) => void;
};

export function CompetitionTable({
  competitions,
  editingCompetitionId,
  editingCompetitionForm,
  updatingCompetitionId,
  deletingCompetitionId,
  onStartEdit,
  onChangeEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: CompetitionTableProps) {
  const columns: ColumnsType<CompetitionItem> = useMemo(
    () => [
      {
        title: competitionsLabels.dateColumn,
        dataIndex: "date",
        width: 130,
        render: (value: string, record) =>
          editingCompetitionId === record.id ? (
            <DatePicker
              value={editingCompetitionForm.date}
              onChange={(date) => {
                onChangeEdit("date", date);
              }}
              format={COMPETITIONS_DISPLAY_DATE_FORMAT}
              disabled={updatingCompetitionId === record.id}
              className={styles.dateInput}
            />
          ) : (
            formatCompetitionDate(value)
          ),
      },
      {
        title: competitionsLabels.nameLocationColumn,
        dataIndex: "nameLocation",
        render: (value: string, record) =>
          editingCompetitionId === record.id ? (
            <Input
              value={editingCompetitionForm.nameLocation}
              onChange={(event) => {
                onChangeEdit("nameLocation", event.target.value);
              }}
              disabled={updatingCompetitionId === record.id}
              maxLength={255}
            />
          ) : (
            value
          ),
      },
      {
        title: competitionsLabels.distanceColumn,
        dataIndex: "distanceLabel",
        width: 120,
        render: (value: string, record) =>
          editingCompetitionId === record.id ? (
            <Input
              value={editingCompetitionForm.distanceLabel}
              onChange={(event) => {
                onChangeEdit("distanceLabel", event.target.value);
              }}
              disabled={updatingCompetitionId === record.id}
              maxLength={64}
              className={styles.distanceInput}
            />
          ) : (
            value
          ),
      },
      {
        title: competitionsLabels.priorityColumn,
        dataIndex: "priority",
        width: 130,
        render: (value: CompetitionItem["priority"], record) =>
          editingCompetitionId === record.id ? (
            <Select
              value={editingCompetitionForm.priority}
              onChange={(priority) => {
                onChangeEdit("priority", priority);
              }}
              options={[...COMPETITION_PRIORITY_OPTIONS]}
              disabled={updatingCompetitionId === record.id}
              className={styles.priorityInput}
            />
          ) : (
            <Tag color={COMPETITION_PRIORITY_META[value].color}>
              {COMPETITION_PRIORITY_META[value].label}
            </Tag>
          ),
      },
      {
        title: competitionsLabels.resultColumn,
        dataIndex: "result",
        width: 140,
        render: (value: string | null, record) =>
          editingCompetitionId === record.id ? (
            <Input
              value={editingCompetitionForm.result}
              onChange={(event) => {
                onChangeEdit("result", event.target.value);
              }}
              disabled={updatingCompetitionId === record.id}
              maxLength={32}
              className={styles.resultInput}
            />
          ) : (
            value || ""
          ),
      },
      {
        title: competitionsLabels.actionsColumn,
        key: "actions",
        width: 116,
        render: (_, record) => {
          const isEditing = editingCompetitionId === record.id;
          const isUpdating = updatingCompetitionId === record.id;
          const isDeleting = deletingCompetitionId === record.id;
          const actionsDisabled = updatingCompetitionId !== null || deletingCompetitionId !== null;

          if (isEditing) {
            return (
              <div className={styles.actions}>
                <Tooltip title={competitionsLabels.saveButton}>
                  <Button
                    size="small"
                    type="text"
                    icon={<SaveOutlined />}
                    onClick={onSaveEdit}
                    loading={isUpdating}
                    aria-label={competitionsLabels.saveButton}
                  />
                </Tooltip>
                <Tooltip title={competitionsLabels.cancelButton}>
                  <Button
                    size="small"
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={onCancelEdit}
                    disabled={isUpdating}
                    aria-label={competitionsLabels.cancelButton}
                  />
                </Tooltip>
              </div>
            );
          }

          return (
            <div className={styles.actions}>
              <Tooltip title={competitionsLabels.editButton}>
                <Button
                  size="small"
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => {
                    onStartEdit(record);
                  }}
                  disabled={actionsDisabled}
                  aria-label={competitionsLabels.editCompetitionAria}
                />
              </Tooltip>
              <Tooltip title={competitionsLabels.deleteButton}>
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    onDelete(record);
                  }}
                  disabled={actionsDisabled}
                  loading={isDeleting}
                  aria-label={competitionsLabels.deleteCompetitionAria}
                />
              </Tooltip>
            </div>
          );
        },
      },
    ],
    [
      deletingCompetitionId,
      editingCompetitionForm,
      editingCompetitionId,
      onCancelEdit,
      onChangeEdit,
      onDelete,
      onSaveEdit,
      onStartEdit,
      updatingCompetitionId,
    ]
  );

  return (
    <Table
      size="small"
      className={styles.table}
      columns={columns}
      dataSource={competitions}
      rowKey="id"
      pagination={false}
      tableLayout="fixed"
      scroll={{ x: 860 }}
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
  );
}
