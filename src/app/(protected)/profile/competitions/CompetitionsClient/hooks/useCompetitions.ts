"use client";

import { useEffect, useState } from "react";
import type { MessageInstance } from "antd/es/message/interface";
import type { HookAPI as ModalHookAPI } from "antd/es/modal/useModal";
import {
  competitionsLabels,
  COMPETITIONS_COLLAPSED_BLOCKS_KEY,
} from "../constants/competitionsConstants";
import type {
  CompetitionBlockFormState,
  CompetitionBlockFormUpdate,
  CompetitionBlockItem,
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

type UseCompetitionsParams = {
  messageApi: MessageInstance;
  modalApi: ModalHookAPI;
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

export const useCompetitions = ({ messageApi, modalApi }: UseCompetitionsParams) => {
  const [blocks, setBlocks] = useState<CompetitionBlockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingBlock, setSavingBlock] = useState(false);
  const [newBlockForm, setNewBlockForm] = useState<CompetitionBlockFormState>(() =>
    createEmptyBlockForm()
  );
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [editingBlockForm, setEditingBlockForm] = useState<CompetitionBlockFormState>(() =>
    createEmptyBlockForm()
  );
  const [updatingBlockId, setUpdatingBlockId] = useState<number | null>(null);
  const [deletingBlockId, setDeletingBlockId] = useState<number | null>(null);
  const [competitionForms, setCompetitionForms] = useState<Record<number, CompetitionFormState>>(
    {}
  );
  const [creatingCompetitionBlockId, setCreatingCompetitionBlockId] = useState<number | null>(null);
  const [editingCompetitionId, setEditingCompetitionId] = useState<number | null>(null);
  const [editingCompetitionForm, setEditingCompetitionForm] = useState<CompetitionFormState>(() =>
    createEmptyCompetitionForm()
  );
  const [updatingCompetitionId, setUpdatingCompetitionId] = useState<number | null>(null);
  const [deletingCompetitionId, setDeletingCompetitionId] = useState<number | null>(null);
  const [collapsedBlockIds, setCollapsedBlockIds] = useState<Set<number>>(() =>
    readCollapsedBlockIds()
  );

  useEffect(() => {
    let active = true;

    fetch("/api/competition-blocks", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!active) {
          return;
        }

        if (!response.ok) {
          messageApi.error(competitionsLabels.loadFail);
          setBlocks([]);
          return;
        }

        setBlocks(getBlocksFromResponse(data));
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        console.error(error);
        messageApi.error(competitionsLabels.loadFail);
        setBlocks([]);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [messageApi]);

  useEffect(() => {
    writeCollapsedBlockIds(collapsedBlockIds);
  }, [collapsedBlockIds]);

  const updateNewBlockForm: CompetitionBlockFormUpdate = (key, value) => {
    setNewBlockForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateEditingBlockForm: CompetitionBlockFormUpdate = (key, value) => {
    setEditingBlockForm((prev) => ({ ...prev, [key]: value }));
  };

  const getCompetitionForm = (blockId: number) =>
    competitionForms[blockId] ?? createEmptyCompetitionForm();

  const updateCompetitionForm = <Key extends keyof CompetitionFormState>(
    blockId: number,
    key: Key,
    value: CompetitionFormState[Key]
  ) => {
    setCompetitionForms((prev) => ({
      ...prev,
      [blockId]: {
        ...(prev[blockId] ?? createEmptyCompetitionForm()),
        [key]: value,
      },
    }));
  };

  const updateEditingCompetitionForm = <Key extends keyof CompetitionFormState>(
    key: Key,
    value: CompetitionFormState[Key]
  ) => {
    setEditingCompetitionForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleBlock = (blockId: number) => {
    setCollapsedBlockIds((prev) => {
      const next = new Set(prev);
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
      messageApi.warning(validation.error);
      return;
    }

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
        return;
      }

      const block = getBlockFromResponse(data);
      if (!block) {
        messageApi.error(competitionsLabels.saveFail);
        return;
      }

      setBlocks((prev) => upsertBlock(prev, block));
      setCollapsedBlockIds((prev) => {
        const next = new Set(prev);
        next.delete(block.id);
        return next;
      });
      setNewBlockForm(createEmptyBlockForm());
      messageApi.success(competitionsLabels.blockSaveOk);
    } catch (error) {
      console.error(error);
      messageApi.error(competitionsLabels.saveFail);
    } finally {
      setSavingBlock(false);
    }
  };

  const handleStartBlockEdit = (block: CompetitionBlockItem) => {
    setEditingBlockId(block.id);
    setEditingBlockForm(createBlockFormFromBlock(block));
  };

  const handleCancelBlockEdit = () => {
    setEditingBlockId(null);
    setEditingBlockForm(createEmptyBlockForm());
  };

  const handleSaveBlockEdit = async () => {
    if (editingBlockId === null) {
      return;
    }

    const validation = validateBlockForm(editingBlockForm);
    if (!validation.ok) {
      messageApi.warning(validation.error);
      return;
    }

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
        return;
      }

      const block = getBlockFromResponse(data);
      if (!block) {
        messageApi.error(competitionsLabels.updateFail);
        return;
      }

      setBlocks((prev) => upsertBlock(prev, block));
      handleCancelBlockEdit();
      messageApi.success(competitionsLabels.blockUpdateOk);
    } catch (error) {
      console.error(error);
      messageApi.error(competitionsLabels.updateFail);
    } finally {
      setUpdatingBlockId(null);
    }
  };

  const confirmDelete = (title: string) =>
    new Promise<boolean>((resolve) => {
      modalApi.confirm({
        title,
        okText: competitionsLabels.deleteButton,
        okButtonProps: { danger: true },
        cancelText: competitionsLabels.cancelButton,
        onOk: () => {
          resolve(true);
        },
        onCancel: () => {
          resolve(false);
        },
      });
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

      setBlocks((prev) => prev.filter((item) => item.id !== block.id));
      if (editingBlockId === block.id) {
        handleCancelBlockEdit();
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
      messageApi.warning(validation.error);
      return;
    }

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
        return;
      }

      const competition = getCompetitionFromResponse(data);
      if (!competition) {
        messageApi.error(competitionsLabels.saveFail);
        return;
      }

      setBlocks((prev) => addCompetitionToBlock(prev, competition));
      setCompetitionForms((prev) => ({
        ...prev,
        [blockId]: createEmptyCompetitionForm(),
      }));
      messageApi.success(competitionsLabels.competitionSaveOk);
    } catch (error) {
      console.error(error);
      messageApi.error(competitionsLabels.saveFail);
    } finally {
      setCreatingCompetitionBlockId(null);
    }
  };

  const handleStartCompetitionEdit = (competition: CompetitionItem) => {
    setEditingCompetitionId(competition.id);
    setEditingCompetitionForm(createCompetitionFormFromItem(competition));
  };

  const handleCancelCompetitionEdit = () => {
    setEditingCompetitionId(null);
    setEditingCompetitionForm(createEmptyCompetitionForm());
  };

  const handleSaveCompetitionEdit = async () => {
    if (editingCompetitionId === null) {
      return;
    }

    const validation = validateCompetitionForm(editingCompetitionForm);
    if (!validation.ok) {
      messageApi.warning(validation.error);
      return;
    }

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
        return;
      }

      const competition = getCompetitionFromResponse(data);
      if (!competition) {
        messageApi.error(competitionsLabels.updateFail);
        return;
      }

      setBlocks((prev) => updateCompetitionInBlocks(prev, competition));
      handleCancelCompetitionEdit();
      messageApi.success(competitionsLabels.competitionUpdateOk);
    } catch (error) {
      console.error(error);
      messageApi.error(competitionsLabels.updateFail);
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

      setBlocks((prev) => removeCompetitionFromBlocks(prev, competition.id));
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
    savingBlock,
    newBlockForm,
    editingBlockId,
    editingBlockForm,
    updatingBlockId,
    deletingBlockId,
    creatingCompetitionBlockId,
    editingCompetitionId,
    editingCompetitionForm,
    updatingCompetitionId,
    deletingCompetitionId,
    collapsedBlockIds,
    updateNewBlockForm,
    updateEditingBlockForm,
    getCompetitionForm,
    updateCompetitionForm,
    updateEditingCompetitionForm,
    toggleBlock,
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
