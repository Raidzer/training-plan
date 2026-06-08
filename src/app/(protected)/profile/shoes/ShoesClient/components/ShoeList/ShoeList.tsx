import { Typography } from "antd";
import { ShoeListItem } from "../ShoeListItem/ShoeListItem";
import { shoesLabels } from "../../constants/shoesConstants";
import type {
  ShoeFormState,
  ShoeFormUpdate,
  ShoeItem,
  ShoeNotificationAvailability,
} from "../../types/shoesTypes";
import styles from "./ShoeList.module.scss";

type ShoeListProps = {
  items: ShoeItem[];
  loading: boolean;
  saving: boolean;
  editingId: number | null;
  editingForm: ShoeFormState;
  notificationAvailability: ShoeNotificationAvailability;
  updatingId: number | null;
  deletingId: number | null;
  onStartEdit: (item: ShoeItem) => void;
  onChangeEdit: ShoeFormUpdate;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (item: ShoeItem) => void;
};

export function ShoeList({
  items,
  loading,
  saving,
  editingId,
  editingForm,
  notificationAvailability,
  updatingId,
  deletingId,
  onStartEdit,
  onChangeEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: ShoeListProps) {
  return (
    <>
      <Typography.Title level={5} className={styles.listTitle}>
        {shoesLabels.listTitle}
      </Typography.Title>
      <div className={styles.list}>
        {loading ? (
          <Typography.Text>{shoesLabels.loadingText}</Typography.Text>
        ) : (
          <>
            {items.length === 0 ? (
              <Typography.Text type="secondary">{shoesLabels.emptyText}</Typography.Text>
            ) : (
              <div>
                {items.map((item) => (
                  <ShoeListItem
                    key={item.id}
                    item={item}
                    isEditing={editingId === item.id}
                    editingForm={editingForm}
                    notificationAvailability={notificationAvailability}
                    updating={updatingId === item.id}
                    deleting={deletingId === item.id}
                    actionsDisabled={saving || updatingId !== null || deletingId !== null}
                    onStartEdit={onStartEdit}
                    onChangeEdit={onChangeEdit}
                    onSaveEdit={onSaveEdit}
                    onCancelEdit={onCancelEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
