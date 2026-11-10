"use client";

import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import { Alert, Button } from "antd";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AVATAR_SOURCE_MIME_TYPES } from "@/shared/constants/profileAvatar";
import { AVATAR_LABELS } from "../../constants/avatarConstants";
import { useProfileAvatar } from "../../hooks/useProfileAvatar";
import { AvatarCropModal } from "../AvatarCropModal/AvatarCropModal";
import styles from "./ProfileAvatar.module.scss";

type ProfileAvatarProps = {
  initialVersion?: string | null;
  initials: string;
  displayName: string;
};

export function ProfileAvatar({ initialVersion, initials, displayName }: ProfileAvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectButtonRef = useRef<HTMLButtonElement>(null);
  const [failedVersion, setFailedVersion] = useState<string | null>(null);
  const avatar = useProfileAvatar(initialVersion);
  const busy = avatar.operation !== null;
  const imageFailed = Boolean(avatar.version && failedVersion === avatar.version);
  const hasSource = avatar.source !== null;
  const selectLabel = avatar.version ? AVATAR_LABELS.replace : AVATAR_LABELS.choose;
  const hadSource = useRef(false);

  useEffect(() => {
    if (hadSource.current && !hasSource) {
      selectButtonRef.current?.focus();
    }
    hadSource.current = hasSource;
  }, [hasSource]);

  return (
    <div className={styles.root}>
      <div className={styles.avatar}>
        {avatar.version && !imageFailed ? (
          <Image
            key={avatar.version}
            src={`/api/profile/avatar?v=${encodeURIComponent(avatar.version)}`}
            alt={`${AVATAR_LABELS.photo}: ${displayName}`}
            width={80}
            height={80}
            unoptimized
            onError={() => setFailedVersion(avatar.version)}
          />
        ) : (
          <span role="img" aria-label={`${AVATAR_LABELS.photo}: ${displayName}`}>
            {initials}
          </span>
        )}
      </div>
      <div className={styles.actions}>
        <Button
          ref={selectButtonRef}
          size="large"
          aria-label={selectLabel}
          icon={<UploadOutlined aria-hidden />}
          disabled={busy || Boolean(avatar.source)}
          loading={avatar.operation === "loading"}
          onClick={() => inputRef.current?.click()}
        >
          {selectLabel}
        </Button>
        {avatar.version ? (
          <Button
            size="large"
            aria-label={AVATAR_LABELS.remove}
            icon={<DeleteOutlined aria-hidden />}
            disabled={busy || Boolean(avatar.source)}
            loading={avatar.operation === "deleting"}
            onClick={() => void avatar.deleteAvatar()}
          >
            {AVATAR_LABELS.remove}
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={AVATAR_SOURCE_MIME_TYPES.join(",")}
        aria-label={AVATAR_LABELS.file}
        hidden
        disabled={busy}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) {
            void avatar.selectFile(file);
          }
        }}
      />
      <p className={styles.hint}>{AVATAR_LABELS.formats}</p>
      <div role="status" aria-live="polite" className={styles.status}>
        {avatar.operation === "loading" ? AVATAR_LABELS.loading : avatar.status}
      </div>
      {avatar.error && !avatar.source ? (
        <Alert type="error" showIcon title={avatar.error} role="alert" />
      ) : null}
      {imageFailed ? <p className={styles.hint}>{AVATAR_LABELS.imageError}</p> : null}
      {avatar.source ? (
        <AvatarCropModal
          key={avatar.source.url}
          source={avatar.source}
          saving={avatar.operation === "saving"}
          error={avatar.error}
          onCancel={avatar.cancelCrop}
          onSave={avatar.saveCrop}
        />
      ) : null}
    </div>
  );
}
