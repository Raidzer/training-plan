"use client";

import { Alert, Modal, Slider, Spin } from "antd";
import { useId, useRef, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { AVATAR_LABELS, AVATAR_MAX_ZOOM } from "../../constants/avatarConstants";
import type { AvatarSource } from "../../types/avatarTypes";
import styles from "./AvatarCropModal.module.scss";

type AvatarCropModalProps = {
  source: AvatarSource;
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onSave: (area: Area) => Promise<void>;
};

export function AvatarCropModal({ source, saving, error, onCancel, onSave }: AvatarCropModalProps) {
  const instructionsId = useId();
  const zoomLabelId = useId();
  const [ready, setReady] = useState(false);
  const [viewport, setViewport] = useState({ crop: { x: 0, y: 0 }, zoom: 1 });
  const viewportRef = useRef(viewport);
  const areaRef = useRef<Area | null>(null);
  const [hasCrop, setHasCrop] = useState(false);

  const updateViewport = (next: typeof viewport) => {
    if (saving) {
      return;
    }
    viewportRef.current = next;
    areaRef.current = null;
    setHasCrop(false);
    setViewport(next);
  };

  const handleCropChange = (crop: Point) => {
    const current = viewportRef.current;
    if (crop.x === current.crop.x && crop.y === current.crop.y) {
      return;
    }
    updateViewport({ ...current, crop });
  };

  const handleZoomChange = (zoom: number) => {
    if (zoom === viewportRef.current.zoom) {
      return;
    }
    updateViewport({ ...viewportRef.current, zoom });
  };

  const handleCropAreaChange = (_percentages: Area, pixels: Area) => {
    if (viewportRef.current !== viewport || saving) {
      return;
    }
    areaRef.current = pixels;
    setHasCrop(true);
  };

  return (
    <Modal
      title={AVATAR_LABELS.title}
      open
      centered
      width={560}
      destroyOnHidden
      mask={{ closable: false }}
      keyboard={!saving}
      closable={!saving}
      onCancel={onCancel}
      afterOpenChange={setReady}
      confirmLoading={saving}
      okText={AVATAR_LABELS.save}
      cancelText={AVATAR_LABELS.cancel}
      okButtonProps={{
        size: "large",
        disabled: !ready || !hasCrop || saving,
        "aria-label": AVATAR_LABELS.save,
        "aria-busy": saving,
      }}
      cancelButtonProps={{ size: "large", disabled: saving }}
      classNames={{ close: styles.close }}
      rootClassName={styles.modalRoot}
      onOk={() => {
        if (areaRef.current && !saving) {
          void onSave(areaRef.current);
        }
      }}
    >
      <div className={styles.content}>
        <p id={instructionsId} className={styles.instructions}>
          {AVATAR_LABELS.instructions}
        </p>
        <div className={styles.cropArea} inert={saving}>
          {ready ? (
            <Cropper
              image={source.url}
              crop={viewport.crop}
              zoom={viewport.zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              maxZoom={AVATAR_MAX_ZOOM}
              zoomWithScroll={false}
              keyboardStep={10}
              onCropChange={handleCropChange}
              onZoomChange={handleZoomChange}
              onCropAreaChange={handleCropAreaChange}
              cropperProps={{
                role: "group",
                "aria-label": AVATAR_LABELS.crop,
                "aria-describedby": instructionsId,
                tabIndex: 0,
              }}
              mediaProps={{ alt: AVATAR_LABELS.selectedPhoto }}
              classes={{ cropAreaClassName: styles.cropper }}
            />
          ) : (
            <Spin />
          )}
        </div>
        <div>
          <div className={styles.zoomLabel}>
            <span id={zoomLabelId}>{AVATAR_LABELS.zoom}</span>
            <span aria-hidden>{Math.round(viewport.zoom * 100)}%</span>
          </div>
          <Slider
            min={1}
            max={AVATAR_MAX_ZOOM}
            step={0.01}
            value={viewport.zoom}
            disabled={saving || !ready}
            onChange={handleZoomChange}
            ariaLabelledByForHandle={zoomLabelId}
            ariaValueTextFormatterForHandle={(value) => `${Math.round(value * 100)}%`}
            tooltip={{ formatter: (value) => `${Math.round((value ?? 1) * 100)}%` }}
            className={styles.slider}
          />
        </div>
        {error ? <Alert type="error" showIcon title={error} role="alert" /> : null}
      </div>
    </Modal>
  );
}
