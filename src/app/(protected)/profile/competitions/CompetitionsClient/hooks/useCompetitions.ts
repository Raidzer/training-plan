"use client";

import { App } from "antd";
import { useCallback, useEffect, useState } from "react";
import {
  competitionsLabels,
  COMPETITIONS_COLLAPSED_BLOCKS_KEY,
} from "../constants/competitionsConstants";
import type {
  CompetitionBlockFormError,
  CompetitionBlockFormState,
  CompetitionBlockFormUpdate,
  CompetitionBlockItem,
  CompetitionFormError,
  CompetitionFormState,
  CompetitionItem,
} from "../types/competitionsTypes";
import {
  addCompetitionToBlock,
  createBlockFormFromBlock,
  createCompetitionFormFromItem,
  createEmptyBlockForm,
  createEmptyCompetitionForm,
  getBlockFromResponse,
  getBlocksFromResponse,
  getCompetitionFromResponse,
  removeCompetitionFromBlocks,
  upsertBlock,
  updateCompetitionInBlocks,
  validateBlockForm,
  validateCompetitionForm,
} from "../utils/competitionsUtils";

type AppContextValue = ReturnType<typeof App.useApp>;

type UseCompetitionsParams = {
  messageApi: AppContextValue["message"];
  modalApi: AppContextValue["modal"];
};

const readCollapsedBlockIds = () => {
  if (typeof window === "undefined") {
    return new Set<number>();
  }

  try {
    const rawValue = window.localStorage.getItem(COMPETITIONS_COLLAPSED_BLOCKS_KEY);
    const parsed = rawValue ? JSON.parse(rawValue) : [];
    if (!Array.isArray(parsed)) {
      return new Set<number>();
    }

    return new Set(
      parsed.map((item) => Number(item)).filter((item) => Number.isFinite(item) && item > 0)
    );
  } catch (error) {
    console.error(error);
    return new Set<number>();
  }
};

const writeCollapsedBlockIds = (ids: Set<number>) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(COMPETITIONS_COLLAPSED_BLOCKS_KEY, JSON.stringify([...ids]));
  } catch (error) {
    console.error(error);
  }
};

const logUnexpectedLoadError = (error: unknown) => {
  const isExpectedResponseError =
    error instanceof Error && error.message === competitionsLabels.loadFail;

  if (!isExpectedResponseError) {
    console.error(error);
  }
};
export const useCompetitions = ({ messageApi, modalApi }: UseCompetitionsParams) => {
  const [blocks, setBlocks] = useState<CompetitionBlockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [savingBlock, setSavingBlock] = useState(false);
  const [newBlockForm, setNewBlockForm] = useState<CompetitionBlockFormState>(() =>
    createEmptyBlockForm()
  );
  const [newBlockFormError, setNewBlockFormError] = useState<CompetitionBlockFormError | null>(
    null
  );
  const [newBlockValidationAttempt, setNewBlockValidationAttempt] = useState(0);
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [editingBlockForm, setEditingBlockForm] = useState<CompetitionBlockFormState>(() =>
    createEmptyBlockForm()
  );
  const [editingBlockFormError, setEditingBlockFormError] =
    useState<CompetitionBlockFormError | null>(null);
  const [editingBlockValidationAttempt, setEditingBlockValidationAttempt] = useState(0);
  const [updatingBlockId, setUpdatingBlockId] = useState<number | null>(null);
  const [deletingBlockId, setDeletingBlockId] = useState<number | null>(null);
  const [competitionForms, setCompetitionForms] = useState<Record<number, CompetitionFormState>>(
    {}
  );
  const [competitionFormErrors, setCompetitionFormErrors] = useState<
    Record<number, CompetitionFormError | null>
  >({});
  const [competitionValidationAttempts, setCompetitionValidationAttempts] = useState<
    Record<number, number>
  >({});
  const [creatingCompetitionBlockId, setCreatingCompetitionBlockId] = useState<number | null>(null);
  const [editingCompetitionId, setEditingCompetitionId] = useState<number | null>(null);
  const [editingCompetitionForm, setEditingCompetitionForm] = useState<CompetitionFormState>(() =>
    createEmptyCompetitionForm()
  );
  const [editingCompetitionFormError, setEditingCompetitionFormError] =
    useState<CompetitionFormError | null>(null);
  const [editingCompetitionValidationAttempt, setEditingCompetitionValidationAttempt] = useState(0);
  const [updatingCompetitionId, setUpdatingCompetitionId] = useState<number | null>(null);
  const [deletingCompetitionId, setDeletingCompetitionId] = useState<number | null>(null);
  const [collapsedBlockIds, setCollapsedBlockIds] = useState<Set<number>>(() =>
    readCollapsedBlockIds()
  );

  const requestBlocks = useCallback(async () => {
    const response = await fetch("/api/competition-blocks", { cache: "no-store" });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(competitionsLabels.loadFail);
    }

    return getBlocksFromResponse(data);
  }, []);

  const handleRetry = useCallback(async () => {
    setLoading(true);
    setLoadError(false);

    try {
      const nextBlocks = await requestBlocks();
      setBlocks(nextBlocks);
    } catch (error) {
      logUnexpectedLoadError(error);
      setBlocks([]);
      setLoadError(true);
      messageApi.error(competitionsLabels.loadFail);
    } finally {
      setLoading(false);
    }
  }, [messageApi, requestBlocks]);

  useEffect(() => {
    let active = true;

    requestBlocks()
      .then((nextBlocks) => {
        if (!active) {
          return;
        }

        setBlocks(nextBlocks);
        setLoadError(false);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        logUnexpectedLoadError(error);
        setBlocks([]);
        setLoadError(true);
        messageApi.error(competitionsLabels.loadFail);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [messageApi, requestBlocks]);

  useEffect(() => {
    writeCollapsedBlockIds(collapsedBlockIds);
  }, [collapsedBlockIds]);

  const updateNewBlockForm: CompetitionBlockFormUpdate = (key, value) => {
    setNewBlockForm((previous) => ({ ...previous, [key]: value }));
    setNewBlockFormError((previous) => {
      if (previous?.field === key) {
        return null;
      }

      return previous;
    });
  };

  const updateEditingBlockForm: CompetitionBlockFormUpdate = (key, value) => {
    setEditingBlockForm((previous) => ({ ...previous, [key]: value }));
    setEditingBlockFormError((previous) => {
      if (previous?.field === key) {
        return null;
      }

      return previous;
    });
  };

  const getCompetitionForm = (blockId: number) =>
    competitionForms[blockId] ?? createEmptyCompetitionForm();

  const getCompetitionFormError = (blockId: number) => competitionFormErrors[blockId] ?? null;

  const getCompetitionValidationAttempt = (blockId: number) =>
    competitionValidationAttempts[blockId] ?? 0;

  const updateCompetitionForm = <Key extends keyof CompetitionFormState>(
    blockId: number,
    key: Key,
    value: CompetitionFormState[Key]
  ) => {
    setCompetitionForms((previous) => ({
      ...previous,
      [blockId]: {
        ...(previous[blockId] ?? createEmptyCompetitionForm()),
        [key]: value,
      },
    }));
    setCompetitionFormErrors((previous) => {
      if (previous[blockId]?.field !== key) {
        return previous;
      }

      return {
        ...previous,
        [blockId]: null,
      };
    });
  };

  const updateEditingCompetitionForm = <Key extends keyof CompetitionFormState>(
    key: Key,
    value: CompetitionFormState[Key]
  ) => {
    setEditingCompetitionForm((previous) => ({
      ...previous,
      [key]: value,
    }));
    setEditingCompetitionFormError((previous) => {
      if (previous?.field === key) {
        return null;
      }

      return previous;
    });
  };

  const toggleBlock = (blockId: number) => {
    setCollapsedBlockIds((previous) => {
      const next = new Set(previous);
      if (next.has(blockId)) {
        next.delete(blockId);
      } else {
        next.add(blockId);
      }

      return next;
    });
  };

  const handleCreateBlock = async () => {
    const validation = validateBlockForm(newBlockForm);
    if (!validation.ok) {
      setNewBlockFormError({
        field: validation.field,
        message: validation.error,
      });
      setNewBlockValidationAttempt((previous) => previous + 1);
      messageApi.warning(validation.error);
      return false;
    }

    setNewBlockFormError(null);
    setSavingBlock(true);
    try {
      const response = await fetch("/api/competition-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.value),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        messageApi.error(competitionsLabels.saveFail);
        return false;
      }

      const block = getBlockFromResponse(data);
      if (!block) {
        messageApi.error(competitionsLabels.saveFail);
        return false;
      }

      setBlocks((previous) => upsertBlock(previous, block));
      setCollapsedBlockIds((previous) => {
        const next = new Set(previous);
        next.delete(block.id);
        return next;
      });
      setNewBlockForm(createEmptyBlockForm());
      messageApi.success(competitionsLabels.blockSaveOk);
      return true;
    } catch (error) {
      console.error(error);
      messageApi.error(competitionsLabels.saveFail);
      return false;
    } finally {
      setSavingBlock(false);
    }
  };

  const handleStartBlockEdit = (block: CompetitionBlockItem) => {
    setEditingBlockId(block.id);
    setEditingBlockForm(createBlockFormFromBlock(block));
    setEditingBlockFormError(null);
  };

  const handleCancelBlockEdit = () => {
    setEditingBlockId(null);
    setEditingBlockForm(createEmptyBlockForm());
    setEditingBlockFormError(null);
  };

  const handleSaveBlockEdit = async () => {
    if (editingBlockId === null) {
      return false;
    }

    const validation = validateBlockForm(editingBlockForm);
    if (!validation.ok) {
      setEditingBlockFormError({
        field: validation.field,
        message: validation.error,
      });
      setEditingBlockValidationAttempt((previous) => previous + 1);
      messageApi.warning(validation.error);
      return false;
    }

    setEditingBlockFormError(null);
    setUpdatingBlockId(editingBlockId);
    try {
      const response = await fetch(`/api/competition-blocks/${editingBlockId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.value),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        messageApi.error(competitionsLabels.updateFail);
        return false;
      }

      const block = getBlockFromResponse(data);
      if (!block) {
        messageApi.error(competitionsLabels.updateFail);
        return false;
      }

      setBlocks((previous) => upsertBlock(previous, block));
      handleCancelBlockEdit();
      messageApi.success(competitionsLabels.blockUpdateOk);
      return true;
    } catch (error) {
      console.error(error);
      messageApi.error(competitionsLabels.updateFail);
      return false;
    } finally {
      setUpdatingBlockId(null);
    }
  };

  const confirmDelete = (title: string) =>
    modalApi.confirm({
      title,
      okText: competitionsLabels.deleteButton,
      okButtonProps: { danger: true },
      cancelText: competitionsLabels.cancelButton,
    });

  const handleDeleteBlock = async (block: CompetitionBlockItem) => {
    const confirmed = await confirmDelete(competitionsLabels.blockDeleteConfirm);
    if (!confirmed) {
      return;
    }

    setDeletingBlockId(block.id);
    try {
      const response = await fetch(`/api/competition-blocks/${block.id}`, {
        method: "DELETE",
      });
      await response.json().catch(() => null);

      if (!response.ok) {
        messageApi.error(competitionsLabels.deleteFail);
        return;
      }

      setBlocks((previous) => previous.filter((item) => item.id !== block.id));
      setCollapsedBlockIds((previous) => {
        const next = new Set(previous);
        next.delete(block.id);
        return next;
      });
      setCompetitionForms((previous) => {
        const next = { ...previous };
        delete next[block.id];
        return next;
      });
      setCompetitionFormErrors((previous) => {
        const next = { ...previous };
        delete next[block.id];
        return next;
      });
      setCompetitionValidationAttempts((previous) => {
        const next = { ...previous };
        delete next[block.id];
        return next;
      });

      if (editingBlockId === block.id) {
        handleCancelBlockEdit();
      }

      const editingCompetitionBelongsToBlock = block.competitions.some(
        (competition) => competition.id === editingCompetitionId
      );
      if (editingCompetitionBelongsToBlock) {
        handleCancelCompetitionEdit();
      }
      messageApi.success(competitionsLabels.blockDeleteOk);
    } catch (error) {
      console.error(error);
      messageApi.error(competitionsLabels.deleteFail);
    } finally {
      setDeletingBlockId(null);
    }
  };

  const handleCreateCompetition = async (blockId: number) => {
    const form = getCompetitionForm(blockId);
    const validation = validateCompetitionForm(form);
    if (!validation.ok) {
      setCompetitionFormErrors((previous) => ({
        ...previous,
        [blockId]: {
          field: validation.field,
          message: validation.error,
        },
      }));
      setCompetitionValidationAttempts((previous) => ({
        ...previous,
        [blockId]: (previous[blockId] ?? 0) + 1,
      }));
      messageApi.warning(validation.error);
      return false;
    }

    setCompetitionFormErrors((previous) => ({
      ...previous,
      [blockId]: null,
    }));
    setCreatingCompetitionBlockId(blockId);
    try {
      const response = await fetch(`/api/competition-blocks/${blockId}/competitions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.value),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        messageApi.error(competitionsLabels.saveFail);
        return false;
      }

      const competition = getCompetitionFromResponse(data);
      if (!competition) {
        messageApi.error(competitionsLabels.saveFail);
        return false;
      }

      setBlocks((previous) => addCompetitionToBlock(previous, competition));
      setCompetitionForms((previous) => ({
        ...previous,
        [blockId]: createEmptyCompetitionForm(),
      }));
      messageApi.success(competitionsLabels.competitionSaveOk);
      return true;
    } catch (error) {
      console.error(error);
      messageApi.error(competitionsLabels.saveFail);
      return false;
    } finally {
      setCreatingCompetitionBlockId(null);
    }
  };

  const handleStartCompetitionEdit = (competition: CompetitionItem) => {
    setEditingCompetitionId(competition.id);
    setEditingCompetitionForm(createCompetitionFormFromItem(competition));
    setEditingCompetitionFormError(null);
  };

  const handleCancelCompetitionEdit = () => {
    setEditingCompetitionId(null);
    setEditingCompetitionForm(createEmptyCompetitionForm());
    setEditingCompetitionFormError(null);
  };

  const handleSaveCompetitionEdit = async () => {
    if (editingCompetitionId === null) {
      return false;
    }

    const validation = validateCompetitionForm(editingCompetitionForm);
    if (!validation.ok) {
      setEditingCompetitionFormError({
        field: validation.field,
        message: validation.error,
      });
      setEditingCompetitionValidationAttempt((previous) => previous + 1);
      messageApi.warning(validation.error);
      return false;
    }

    setEditingCompetitionFormError(null);
    setUpdatingCompetitionId(editingCompetitionId);
    try {
      const response = await fetch(`/api/competitions/${editingCompetitionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.value),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        messageApi.error(competitionsLabels.updateFail);
        return false;
      }

      const competition = getCompetitionFromResponse(data);
      if (!competition) {
        messageApi.error(competitionsLabels.updateFail);
        return false;
      }

      setBlocks((previous) => updateCompetitionInBlocks(previous, competition));
      handleCancelCompetitionEdit();
      messageApi.success(competitionsLabels.competitionUpdateOk);
      return true;
    } catch (error) {
      console.error(error);
      messageApi.error(competitionsLabels.updateFail);
      return false;
    } finally {
      setUpdatingCompetitionId(null);
    }
  };

  const handleDeleteCompetition = async (competition: CompetitionItem) => {
    const confirmed = await confirmDelete(competitionsLabels.competitionDeleteConfirm);
    if (!confirmed) {
      return;
    }

    setDeletingCompetitionId(competition.id);
    try {
      const response = await fetch(`/api/competitions/${competition.id}`, {
        method: "DELETE",
      });
      await response.json().catch(() => null);

      if (!response.ok) {
        messageApi.error(competitionsLabels.deleteFail);
        return;
      }

      setBlocks((previous) => removeCompetitionFromBlocks(previous, competition.id));
      if (editingCompetitionId === competition.id) {
        handleCancelCompetitionEdit();
      }
      messageApi.success(competitionsLabels.competitionDeleteOk);
    } catch (error) {
      console.error(error);
      messageApi.error(competitionsLabels.deleteFail);
    } finally {
      setDeletingCompetitionId(null);
    }
  };

  return {
    blocks,
    loading,
    loadError,
    savingBlock,
    newBlockForm,
    newBlockFormError,
    newBlockValidationAttempt,
    editingBlockId,
    editingBlockForm,
    editingBlockFormError,
    editingBlockValidationAttempt,
    updatingBlockId,
    deletingBlockId,
    creatingCompetitionBlockId,
    editingCompetitionId,
    editingCompetitionForm,
    editingCompetitionFormError,
    editingCompetitionValidationAttempt,
    updatingCompetitionId,
    deletingCompetitionId,
    collapsedBlockIds,
    updateNewBlockForm,
    updateEditingBlockForm,
    getCompetitionForm,
    getCompetitionFormError,
    getCompetitionValidationAttempt,
    updateCompetitionForm,
    updateEditingCompetitionForm,
    toggleBlock,
    handleRetry,
    handleCreateBlock,
    handleStartBlockEdit,
    handleCancelBlockEdit,
    handleSaveBlockEdit,
    handleDeleteBlock,
    handleCreateCompetition,
    handleStartCompetitionEdit,
    handleCancelCompetitionEdit,
    handleSaveCompetitionEdit,
    handleDeleteCompetition,
  };
};
