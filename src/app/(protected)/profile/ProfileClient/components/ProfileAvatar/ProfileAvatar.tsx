"use client";

import { Alert } from "antd";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AVATAR_LABELS } from "../../constants/avatarConstants";
import { useProfileAvatar } from "../../hooks/useProfileAvatar";
import { AvatarCropModal } from "../AvatarCropModal/AvatarCropModal";
import { AvatarUploadModal } from "../AvatarUploadModal/AvatarUploadModal";
import styles from "./ProfileAvatar.module.scss";

type ProfileAvatarProps = {
  initialVersion?: string | null;
  initials: string;
  displayName: string;
};

export function ProfileAvatar({ initialVersion, initials, displayName }: ProfileAvatarProps) {
  const selectButtonRef = useRef<HTMLButtonElement>(null);
  const [failedVersion, setFailedVersion] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const avatar = useProfileAvatar(initialVersion);
  const busy = avatar.operation !== null;
  const imageFailed = Boolean(avatar.version && failedVersion === avatar.version);
  const hasSource = avatar.source !== null;
  const actionsDisabled = busy || hasSource;
  const selectLabel = avatar.version ? AVATAR_LABELS.replace : AVATAR_LABELS.choose;
  const hint =
    avatar.version && !imageFailed ? AVATAR_LABELS.replaceHint : AVATAR_LABELS.chooseHint;
  const hadSource = useRef(false);
  const hadUpload = useRef(false);

  useEffect(() => {
    if (hadSource.current && !hasSource) {
      selectButtonRef.current?.focus();
    }
    hadSource.current = hasSource;
  }, [hasSource]);

  useEffect(() => {
    if (hadUpload.current && !uploadOpen && !hasSource) {
      selectButtonRef.current?.focus();
    }
    hadUpload.current = uploadOpen;
  }, [hasSource, uploadOpen]);

  const handleAvatarClick = async () => {
    if (avatar.version) {
      const opened = await avatar.openCurrentAvatar();
      if (!opened && avatar.version) {
        setUploadOpen(true);
      }
      return;
    }
    setUploadOpen(true);
  };

  const handleUploadCancel = () => {
    setUploadOpen(false);
    avatar.cancelCrop();
  };

  const handleUploadFile = async (file: File) => {
    const loaded = await avatar.selectFile(file);
    if (loaded) {
      setUploadOpen(false);
    }
  };

  const handleUploadDelete = async () => {
    const deleted = await avatar.deleteAvatar();
    if (deleted) {
      setUploadOpen(false);
    }
  };

  return (
    <div className={styles.root}>
      <button
        ref={selectButtonRef}
        type="button"
        className={styles.avatar}
        aria-label={selectLabel}
        aria-busy={busy}
        disabled={actionsDisabled}
        onClick={handleAvatarClick}
      >
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
      </button>
      <p className={styles.hint}>{hint}</p>
      <div role="status" aria-live="polite" className={styles.status}>
        {avatar.operation === "loading" ? AVATAR_LABELS.loading : avatar.status}
      </div>
      {avatar.error && !avatar.source && !uploadOpen ? (
        <Alert type="error" showIcon title={avatar.error} role="alert" />
      ) : null}
      {imageFailed ? <p className={styles.hint}>{AVATAR_LABELS.imageError}</p> : null}
      {avatar.source ? (
        <AvatarCropModal
          key={avatar.source.url}
          source={avatar.source}
          saving={avatar.operation === "saving"}
          deleting={avatar.operation === "deleting"}
          canDelete={Boolean(avatar.version)}
          error={avatar.error}
          onCancel={avatar.cancelCrop}
          onSave={avatar.saveCrop}
          onDelete={async () => {
            await avatar.deleteAvatar();
          }}
        />
      ) : null}
      <AvatarUploadModal
        open={uploadOpen && !hasSource}
        loading={avatar.operation === "loading"}
        error={avatar.error}
        canDelete={Boolean(avatar.version)}
        deleting={avatar.operation === "deleting"}
        onCancel={handleUploadCancel}
        onFileSelect={handleUploadFile}
        onDelete={handleUploadDelete}
      />
    </div>
  );
}
