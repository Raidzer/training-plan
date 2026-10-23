import { describe, expect, it } from "vitest";
import { checkRelease, publishRelease } from "@/scripts/release/publishRelease.mjs";
import { createGithubMock, RELEASE, REPOSITORY, SHA } from "./fixtures";

describe("publishRelease", () => {
  it("создаёт тег на проверенном SHA и Release с текстом файла, затем меняет метки", async () => {
    const github = createGithubMock();
    await publishRelease({ github, ...REPOSITORY, release: RELEASE });
    expect(github.rest.git.createRef).toHaveBeenCalledWith({
      ...REPOSITORY,
      ref: "refs/tags/v1.3.0",
      sha: SHA,
    });
    expect(github.rest.repos.createRelease).toHaveBeenCalledWith({
      ...REPOSITORY,
      tag_name: "v1.3.0",
      target_commitish: SHA,
      name: "v1.3.0",
      body: RELEASE.body,
      draft: false,
      prerelease: false,
      generate_release_notes: false,
    });
    expect(github.rest.issues.addLabels).toHaveBeenCalledWith({
      ...REPOSITORY,
      issue_number: 146,
      labels: ["autorelease: tagged"],
    });
    expect(github.rest.issues.removeLabel).toHaveBeenCalledWith({
      ...REPOSITORY,
      issue_number: 146,
      name: "autorelease: pending",
    });
  });

  it("повторный запуск сохраняет существующие тег и Release", async () => {
    const github = createGithubMock();
    github.rest.git.getRef.mockResolvedValue({ data: { object: { type: "commit", sha: SHA } } });
    github.rest.repos.getReleaseByTag.mockResolvedValue({
      data: { body: RELEASE.body, draft: false },
    });
    await publishRelease({ github, ...REPOSITORY, release: RELEASE });
    expect(github.rest.git.createRef).not.toHaveBeenCalled();
    expect(github.rest.repos.createRelease).not.toHaveBeenCalled();
    expect(github.rest.issues.addLabels).toHaveBeenCalledOnce();
  });

  it.each(["sha", "body", "draft", "orphan", "permission"])(
    "блокирует конфликт до любых записей: %s",
    async (scenario) => {
      const github = createGithubMock();
      if (scenario !== "orphan") {
        github.rest.git.getRef.mockResolvedValue({
          data: { object: { type: "commit", sha: scenario === "sha" ? "b".repeat(40) : SHA } },
        });
      }
      if (scenario === "permission") {
        github.rest.git.getRef.mockRejectedValue(
          Object.assign(new Error("Forbidden"), { status: 403 })
        );
      } else if (scenario !== "sha") {
        github.rest.repos.getReleaseByTag.mockResolvedValue({
          data: {
            body: scenario === "body" ? "Другой текст" : RELEASE.body,
            draft: scenario === "draft",
          },
        });
      }
      await expect(checkRelease({ github, ...REPOSITORY, release: RELEASE })).rejects.toThrow();
      expect(github.rest.git.createRef).not.toHaveBeenCalled();
      expect(github.rest.repos.createRelease).not.toHaveBeenCalled();
    }
  );

  it("разрешает annotated tag на том же коммите", async () => {
    const github = createGithubMock();
    github.rest.git.getRef.mockResolvedValue({
      data: { object: { type: "tag", sha: "c".repeat(40) } },
    });
    github.rest.git.getTag.mockResolvedValue({ data: { object: { type: "commit", sha: SHA } } });
    await checkRelease({ github, ...REPOSITORY, release: RELEASE });
  });

  it("после сбоя создания Release не помечает PR выпущенным", async () => {
    const github = createGithubMock();
    github.rest.repos.createRelease.mockRejectedValue(new Error("API unavailable"));
    await expect(publishRelease({ github, ...REPOSITORY, release: RELEASE })).rejects.toThrow(
      "API unavailable"
    );
    expect(github.rest.issues.addLabels).not.toHaveBeenCalled();
  });

  it("показывает сбой смены метки и завершает его при повторе", async () => {
    const github = createGithubMock();
    github.rest.git.getRef.mockResolvedValue({ data: { object: { type: "commit", sha: SHA } } });
    github.rest.repos.getReleaseByTag.mockResolvedValue({
      data: { body: RELEASE.body, draft: false },
    });
    github.rest.issues.removeLabel.mockRejectedValueOnce(new Error("Label unavailable"));
    await expect(publishRelease({ github, ...REPOSITORY, release: RELEASE })).rejects.toThrow(
      "Label unavailable"
    );
    await publishRelease({ github, ...REPOSITORY, release: RELEASE });
    expect(github.rest.repos.createRelease).not.toHaveBeenCalled();
    expect(github.rest.issues.removeLabel).toHaveBeenCalledTimes(2);
  });
});
