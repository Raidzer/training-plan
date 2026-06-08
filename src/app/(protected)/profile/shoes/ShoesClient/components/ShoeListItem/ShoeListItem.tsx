import { Button, Typography } from "antd";
import { ShoeEditForm } from "../ShoeEditForm/ShoeEditForm";
import { shoesLabels } from "../../constants/shoesConstants";
import type {
  ShoeFormState,
  ShoeFormUpdate,
  ShoeItem,
  ShoeNotificationAvailability,
} from "../../types/shoesTypes";
import { formatMileageValue, formatNotifications } from "../../utils/shoesUtils";
import styles from "./ShoeListItem.module.scss";

type ShoeListItemProps = {
  item: ShoeItem;
  isEditing: boolean;
  editingForm: ShoeFormState;
  notificationAvailability: ShoeNotificationAvailability;
  updating: boolean;
  deleting: boolean;
  actionsDisabled: boolean;
  onStartEdit: (item: ShoeItem) => void;
  onChangeEdit: ShoeFormUpdate;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (item: ShoeItem) => void;
};

export function ShoeListItem({
  item,
  isEditing,
  editingForm,
  notificationAvailability,
  updating,
  deleting,
  actionsDisabled,
  onStartEdit,
  onChangeEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: ShoeListItemProps) {
  if (isEditing) {
    return (
      <div className={styles.listItem}>
        <ShoeEditForm
          form={editingForm}
          currentMileageKm={item.currentMileageKm}
          updating={updating}
          notificationAvailability={notificationAvailability}
          onChange={onChangeEdit}
          onSave={onSaveEdit}
          onCancel={onCancelEdit}
        />
      </div>
    );
  }

  return (
    <div className={styles.listItem}>
      <div className={styles.itemRow}>
        <div className={styles.itemInfo}>
          <Typography.Text className={styles.itemName}>{item.name}</Typography.Text>
          <div className={styles.itemMeta}>
            <Typography.Text type="secondary" className={styles.itemMetaText}>
              {shoesLabels.currentMileageLabel}: {formatMileageValue(item.currentMileageKm)}
            </Typography.Text>
            <Typography.Text type="secondary" className={styles.itemMetaText}>
              {shoesLabels.mileageLimitLabel}: {formatMileageValue(item.mileageLimitKm)}
            </Typography.Text>
            <Typography.Text type="secondary" className={styles.itemMetaText}>
              {shoesLabels.notificationsLabel}: {formatNotifications(item)}
            </Typography.Text>
          </div>
        </div>
        <div className={styles.itemActions}>
          <Button
            type="link"
            onClick={() => {
              onStartEdit(item);
            }}
            disabled={actionsDisabled}
          >
            {shoesLabels.editButton}
          </Button>
          <Button
            type="link"
            danger
            onClick={() => {
              onDelete(item);
            }}
            disabled={actionsDisabled}
            loading={deleting}
          >
            {shoesLabels.deleteButton}
          </Button>
        </div>
      </div>
    </div>
  );
}
