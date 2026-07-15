import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { Alert, DatePicker, InputNumber, Modal, Segmented, Space } from "antd";
import type { Dayjs } from "dayjs";
import { PLAN_DATE_DISPLAY_FORMAT, PLAN_SHIFT_MAX_DAYS } from "../../constants/planConstants";
import { PLAN_TEXT } from "../../constants/planText";
import type { PlanShiftDirection, PlanShiftDraft } from "../../types/planTypes";
import styles from "./PlanShiftModal.module.scss";

type PlanShiftModalProps = {
  open: boolean;
  draft: PlanShiftDraft | null;
  saving: boolean;
  dateValue: Dayjs | null;
  onCancel: () => void;
  onSave: () => void;
  onDateChange: (value: Dayjs | null) => void;
  onDirectionChange: (value: PlanShiftDirection) => void;
  onDaysChange: (value: number | null) => void;
};

export function PlanShiftModal({
  open,
  draft,
  saving,
  dateValue,
  onCancel,
  onSave,
  onDateChange,
  onDirectionChange,
  onDaysChange,
}: PlanShiftModalProps) {
  if (!draft) {
    return null;
  }

  return (
    <Modal
      open={open}
      title={PLAN_TEXT.shift.title}
      width="min(560px, calc(100vw - 24px))"
      className={styles.modal}
      onCancel={onCancel}
      onOk={onSave}
      okText={PLAN_TEXT.shift.save}
      cancelText={PLAN_TEXT.shift.cancel}
      confirmLoading={saving}
      mask={{ closable: !saving }}
      closable={!saving}
      destroyOnHidden
      okButtonProps={{
        disabled: saving,
      }}
      cancelButtonProps={{
        disabled: saving,
      }}
    >
      <Space orientation="vertical" size="middle" className={styles.shiftForm}>
        <Alert
          type="info"
          showIcon
          title={PLAN_TEXT.shift.summary(draft.fromDate)}
          className={styles.summary}
        />
        <div className={styles.shiftField}>
          <label className={styles.fieldLabel} htmlFor="plan-shift-date">
            {PLAN_TEXT.shift.fromDateLabel}
          </label>
          <DatePicker
            id="plan-shift-date"
            value={dateValue}
            onChange={onDateChange}
            format={PLAN_DATE_DISPLAY_FORMAT}
            allowClear={false}
          />
        </div>
        <div className={styles.shiftField}>
          <span id="plan-shift-direction-label" className={styles.fieldLabel}>
            {PLAN_TEXT.shift.directionLabel}
          </span>
          <Segmented
            block
            value={draft.direction}
            onChange={(value) => onDirectionChange(value as PlanShiftDirection)}
            aria-labelledby="plan-shift-direction-label"
            options={[
              {
                value: "forward",
                label: (
                  <span className={styles.directionLabel}>
                    <ArrowRightOutlined aria-hidden />
                    {PLAN_TEXT.shift.directionForward}
                  </span>
                ),
              },
              {
                value: "backward",
                label: (
                  <span className={styles.directionLabel}>
                    <ArrowLeftOutlined aria-hidden />
                    {PLAN_TEXT.shift.directionBackward}
                  </span>
                ),
              },
            ]}
          />
        </div>
        <div className={styles.shiftField}>
          <label className={styles.fieldLabel} htmlFor="plan-shift-days">
            {PLAN_TEXT.shift.daysLabel}
          </label>
          <InputNumber
            id="plan-shift-days"
            name="planShiftDays"
            min={1}
            max={PLAN_SHIFT_MAX_DAYS}
            precision={0}
            value={draft.days}
            onChange={onDaysChange}
            className={styles.daysInput}
          />
        </div>
      </Space>
    </Modal>
  );
}
