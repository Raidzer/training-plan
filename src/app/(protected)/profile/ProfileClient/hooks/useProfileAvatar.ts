"use client";

import { useEffect, useRef, useState } from "react";
import type { Area } from "react-easy-crop";
import { AVATAR_ERRORS, AVATAR_LABELS } from "../constants/avatarConstants";
import type { AvatarOperation, AvatarSource } from "../types/avatarTypes";
import { createAvatarBlob, loadAvatarImage } from "../utils/avatarImage";
import { readJson } from "../utils/profileUtils";

type AvatarApiResponse = { version?: string; success?: boolean; error?: string };

export function useProfileAvatar(initialVersion?: string | null) {
  const [version, setVersion] = useState(initialVersion ?? null);
  const [source, setSource] = useState<AvatarSource | null>(null);
  const [operation, setOperation] = useState<AvatarOperation>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const sourceRef = useRef<AvatarSource | null>(null);
  const operationRef = useRef<AvatarOperation>(null);
  const selectionRef = useRef(0);

  const clearSource = () => {
    if (sourceRef.current) {
      URL.revokeObjectURL(sourceRef.current.url);
      sourceRef.current = null;
    }
    setSource(null);
  };

  const setCurrentOperation = (next: AvatarOperation) => {
    operationRef.current = next;
    setOperation(next);
  };

  useEffect(() => {
    return () => {
      selectionRef.current += 1;
      if (sourceRef.current) {
        URL.revokeObjectURL(sourceRef.current.url);
        sourceRef.current = null;
      }
    };
  }, []);

  const selectFile = async (file: File) => {
    if (operationRef.current === "saving" || operationRef.current === "deleting") {
      return;
    }
    const selection = ++selectionRef.current;
    setCurrentOperation("loading");
    setError(null);
    setStatus(null);
    try {
      const nextSource = await loadAvatarImage(file);
      if (selection !== selectionRef.current) {
        URL.revokeObjectURL(nextSource.url);
        return;
      }
      clearSource();
      sourceRef.current = nextSource;
      setSource(nextSource);
    } catch (cause) {
      if (selection === selectionRef.current) {
        setError(cause instanceof Error ? cause.message : AVATAR_ERRORS.decode);
      }
    } finally {
      if (selection === selectionRef.current) {
        setCurrentOperation(null);
      }
    }
  };

  const cancelCrop = () => {
    if (operationRef.current === "saving" || operationRef.current === "deleting") {
      return;
    }
    selectionRef.current += 1;
    clearSource();
    setCurrentOperation(null);
    setError(null);
  };

  const saveCrop = async (area: Area) => {
    if (operationRef.current || !sourceRef.current) {
      return;
    }
    setCurrentOperation("saving");
    setError(null);
    try {
      const blob = await createAvatarBlob(sourceRef.current.image, area);
      const response = await fetch("/api/profile/avatar", {
        method: "PUT",
        headers: { "Content-Type": "image/webp" },
        body: blob,
      }).catch(() => {
        throw new Error(AVATAR_ERRORS.network);
      });
      const data = await readJson<AvatarApiResponse>(response);
      if (!response.ok || typeof data?.version !== "string" || !data.version) {
        throw new Error(data?.error || AVATAR_ERRORS.save);
      }
      setVersion(data.version);
      clearSource();
      setStatus(AVATAR_LABELS.saved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : AVATAR_ERRORS.save);
    } finally {
      setCurrentOperation(null);
    }
  };

  const deleteAvatar = async () => {
    if (operationRef.current || !version || sourceRef.current) {
      return;
    }
    setCurrentOperation("deleting");
    setError(null);
    setStatus(null);
    try {
      const response = await fetch("/api/profile/avatar", { method: "DELETE" }).catch(() => {
        throw new Error(AVATAR_ERRORS.network);
      });
      const data = await readJson<AvatarApiResponse>(response);
      if (!response.ok || data?.success !== true) {
        throw new Error(data?.error || AVATAR_ERRORS.remove);
      }
      setVersion(null);
      setStatus(AVATAR_LABELS.removed);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : AVATAR_ERRORS.remove);
    } finally {
      setCurrentOperation(null);
    }
  };

  return {
    version,
    source,
    operation,
    error,
    status,
    selectFile,
    cancelCrop,
    saveCrop,
    deleteAvatar,
  };
}
