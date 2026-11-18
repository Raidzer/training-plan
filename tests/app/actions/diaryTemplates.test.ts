import { beforeEach, describe, expect, it, vi } from "vitest";

import type { NewDiaryResultTemplate } from "@/shared/types/diary-templates";

const actionMocks = vi.hoisted(() => ({
  authMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  createTemplateInDbMock: vi.fn(),
  deleteTemplateInDbMock: vi.fn(),
  findMatchingTemplatesMock: vi.fn(),
  findMatchingTemplatesWithDetailsMock: vi.fn(),
  getTemplateByIdFromDbMock: vi.fn(),
  getTemplatesForUserMock: vi.fn(),
  updateTemplateInDbMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: actionMocks.authMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: actionMocks.revalidatePathMock,
}));

vi.mock("@/server/diaryTemplates", () => ({
  createTemplateInDb: actionMocks.createTemplateInDbMock,
  deleteTemplateInDb: actionMocks.deleteTemplateInDbMock,
  findMatchingTemplates: actionMocks.findMatchingTemplatesMock,
  findMatchingTemplatesWithDetails: actionMocks.findMatchingTemplatesWithDetailsMock,
  getTemplateByIdFromDb: actionMocks.getTemplateByIdFromDbMock,
  getTemplatesForUser: actionMocks.getTemplatesForUserMock,
  updateTemplateInDb: actionMocks.updateTemplateInDbMock,
}));

import {
  createTemplate,
  deleteTemplate,
  findMatchingTemplate,
  findMatchingTemplateWithDetails,
  getTemplateById,
  getTemplates,
  updateTemplate,
} from "@/app/actions/diaryTemplates";

function createTemplatePayload(): NewDiaryResultTemplate {
  return {
    userId: 7,
    name: "Tempo",
    code: "TMP",
    matchPattern: "темп",
    schema: [],
    outputTemplate: "{{time}}",
    isInline: false,
    calculations: null,
    sortOrder: 10,
    type: "common",
    level: "general",
  } as NewDiaryResultTemplate;
}

describe("diary template actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    actionMocks.authMock.mockResolvedValue({
      user: {
        id: "7",
        role: "admin",
      },
    });
  });

  it.each(["athlete", "admin"])("scopes reads to the %s session user", async (role) => {
    actionMocks.authMock.mockResolvedValue({ user: { id: "7", role } });
    const templates = [{ id: 1, name: "Tempo" }];
    const template = { id: 2, name: "Long run" };
    const matches = [{ id: 3, name: "Match" }];
    const detailedMatches = [{ id: 4, name: "Detailed match" }];

    actionMocks.getTemplatesForUserMock.mockResolvedValue(templates);
    actionMocks.getTemplateByIdFromDbMock.mockResolvedValue(template);
    actionMocks.findMatchingTemplatesMock.mockResolvedValue(matches);
    actionMocks.findMatchingTemplatesWithDetailsMock.mockResolvedValue(detailedMatches);

    await expect(getTemplates()).resolves.toBe(templates);
    await expect(getTemplateById(2)).resolves.toBe(template);
    await expect(findMatchingTemplate("темп 10 км")).resolves.toBe(matches);
    await expect(findMatchingTemplateWithDetails("темп 10 км")).resolves.toBe(detailedMatches);

    expect(actionMocks.getTemplatesForUserMock).toHaveBeenCalledWith(7);
    expect(actionMocks.getTemplateByIdFromDbMock).toHaveBeenCalledWith(2, 7);
    expect(actionMocks.findMatchingTemplatesMock).toHaveBeenCalledWith(7, "темп 10 км");
    expect(actionMocks.findMatchingTemplatesWithDetailsMock).toHaveBeenCalledWith(7, "темп 10 км");
    expect(actionMocks.authMock).toHaveBeenCalledTimes(4);
  });

  it("blocks every read without a session", async () => {
    actionMocks.authMock.mockResolvedValue(null);

    await expect(getTemplates()).rejects.toThrow("Unauthorized");
    await expect(getTemplateById(2)).rejects.toThrow("Unauthorized");
    await expect(findMatchingTemplate("темп 10 км")).rejects.toThrow("Unauthorized");
    await expect(findMatchingTemplateWithDetails("темп 10 км")).rejects.toThrow("Unauthorized");

    expect(actionMocks.getTemplatesForUserMock).not.toHaveBeenCalled();
    expect(actionMocks.getTemplateByIdFromDbMock).not.toHaveBeenCalled();
    expect(actionMocks.findMatchingTemplatesMock).not.toHaveBeenCalled();
    expect(actionMocks.findMatchingTemplatesWithDetailsMock).not.toHaveBeenCalled();
  });

  it("blocks reads with an invalid session user id", async () => {
    actionMocks.authMock.mockResolvedValue({
      user: {
        id: "not-a-user-id",
        role: "admin",
      },
    });

    await expect(getTemplates()).rejects.toThrow("Unauthorized");
    expect(actionMocks.getTemplatesForUserMock).not.toHaveBeenCalled();
  });

  it("creates template only for admin users and revalidates template list", async () => {
    const payload = createTemplatePayload();
    actionMocks.createTemplateInDbMock.mockResolvedValue(42);

    await expect(createTemplate(payload)).resolves.toBe(42);

    expect(actionMocks.createTemplateInDbMock).toHaveBeenCalledWith(payload);
    expect(actionMocks.revalidatePathMock).toHaveBeenCalledWith("/tools/templates");
  });

  it("updates and deletes templates only for admin users", async () => {
    const patch: Partial<NewDiaryResultTemplate> = {
      name: "Updated tempo",
      sortOrder: 20,
    };

    await expect(updateTemplate(10, patch)).resolves.toBeUndefined();
    await expect(deleteTemplate(11)).resolves.toBeUndefined();

    expect(actionMocks.updateTemplateInDbMock).toHaveBeenCalledWith(10, patch);
    expect(actionMocks.deleteTemplateInDbMock).toHaveBeenCalledWith(11);
    expect(actionMocks.revalidatePathMock).toHaveBeenCalledTimes(2);
    expect(actionMocks.revalidatePathMock).toHaveBeenCalledWith("/tools/templates");
  });

  it("blocks template mutations for non-admin sessions", async () => {
    const payload = createTemplatePayload();
    actionMocks.authMock.mockResolvedValue({
      user: {
        role: "athlete",
      },
    });

    await expect(createTemplate(payload)).rejects.toThrow("Unauthorized");
    await expect(updateTemplate(10, { name: "Updated" })).rejects.toThrow("Unauthorized");
    await expect(deleteTemplate(11)).rejects.toThrow("Unauthorized");

    expect(actionMocks.createTemplateInDbMock).not.toHaveBeenCalled();
    expect(actionMocks.updateTemplateInDbMock).not.toHaveBeenCalled();
    expect(actionMocks.deleteTemplateInDbMock).not.toHaveBeenCalled();
    expect(actionMocks.revalidatePathMock).not.toHaveBeenCalled();
  });
});
