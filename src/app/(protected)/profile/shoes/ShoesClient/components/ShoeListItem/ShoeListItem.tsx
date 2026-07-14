import { BellOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useEffect, useRef } from "react";
import { ShoeEditForm } from "../ShoeEditForm/ShoeEditForm";
import { ShoeMileageProgress } from "../ShoeMileageProgress/ShoeMileageProgress";
import { shoesLabels } from "../../constants/shoesConstants";
import type {
  ShoeFormErrors,
  ShoeFormState,
  ShoeFormUpdate,
  ShoeItem,
  ShoeNotificationAvailability,
} from "../../types/shoesTypes";
import { formatNotifications } from "../../utils/shoesUtils";
import styles from "./ShoeListItem.module.scss";

type ShoeListItemProps = {
  item: ShoeItem;
  isEditing: boolean;
  editingForm: ShoeFormState;
  editingFormErrors: ShoeFormErrors;
  editingValidationAttempt: number;
  notificationAvailability: ShoeNotificationAvailability;
  updating: boolean;
  deleting: boolean;
  actionsDisabled: boolean;
  onStartEdit: (item: ShoeItem) => void;
  onChangeEdit: ShoeFormUpdate;
  onSaveEdit: () => void | Promise<void>;
  onCancelEdit: () => void;
  onDelete: (item: ShoeItem) => void;
};

export function ShoeListItem({
  item,
  isEditing,
  editingForm,
  editingFormErrors,
  editingValidationAttempt,
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
  const editButtonRef = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const shouldRestoreFocusRef = useRef(false);
  const titleId = `shoe-${item.id}-title`;
  const notificationText =
    item.notifyOnLimitEmail || item.notifyOnLimitTelegram
      ? formatNotifications(item)
      : shoesLabels.noNotificationsLabel;

  useEffect(() => {
    if (!isEditing && shouldRestoreFocusRef.current) {
      shouldRestoreFocusRef.current = false;
      editButtonRef.current?.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    shouldRestoreFocusRef.current = true;
    await onSaveEdit();
  };

  const handleCancel = () => {
    shouldRestoreFocusRef.current = true;
    onCancelEdit();
  };

  if (isEditing) {
    return (
      <li className={`${styles.listItem} ${styles.editingItem}`}>
        <ShoeEditForm
          form={editingForm}
          errors={editingFormErrors}
          validationAttempt={editingValidationAttempt}
          currentMileageKm={item.currentMileageKm}
          updating={updating}
          notificationAvailability={notificationAvailability}
          onChange={onChangeEdit}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </li>
    );
  }

  return (
    <li className={styles.listItem}>
      <article className={styles.item} aria-labelledby={titleId}>
        <header className={styles.itemHeader}>
          <div className={styles.itemInfo}>
            <h3 id={titleId} className={styles.itemName}>
              {item.name}
            </h3>
            <div className={styles.notification}>
              <BellOutlined aria-hidden />
              <span>{notificationText}</span>
            </div>
          </div>

          <div className={styles.itemActions}>
            <Button
              ref={editButtonRef}
              icon={<EditOutlined aria-hidden />}
              onClick={() => {
                onStartEdit(item);
              }}
              disabled={actionsDisabled}
            >
              {shoesLabels.editButton}
            </Button>
            <Button
              danger
              icon={<DeleteOutlined aria-hidden />}
              onClick={() => {
                onDelete(item);
              }}
              disabled={actionsDisabled}
              loading={deleting}
            >
              {shoesLabels.deleteButton}
            </Button>
          </div>
        </header>

        <ShoeMileageProgress item={item} />
      </article>
    </li>
  );
}
