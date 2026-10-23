import { describe, expect, it } from "vitest";
import { getReleaseContext } from "@/scripts/release/releaseContext.mjs";
import { createGithubMock, createPullRequest, FILES, RELEASE, REPOSITORY, SHA } from "./fixtures";

describe("getReleaseContext", () => {
  it("не выпускает релиз по одному изменению версии в обычном коммите", async () => {
    const github = createGithubMock();
    expect(await getReleaseContext({ github, ...REPOSITORY, sha: SHA, ...FILES })).toBeNull();
  });

  it.each(["autorelease: pending", "autorelease: tagged"])(
    "распознаёт merge релизного PR с меткой %s",
    async (label) => {
      const github = createGithubMock();
      github.paginate.mockResolvedValue([{ number: 146, labels: [{ name: label }] }]);
      github.rest.pulls.get.mockResolvedValue({
        data: { ...createPullRequest(), labels: [{ name: label }] },
      });
      expect(await getReleaseContext({ github, ...REPOSITORY, sha: SHA, ...FILES })).toEqual(
        RELEASE
      );
    }
  );

  it("проверяет точный merge SHA, не текущую вершину main", async () => {
    const github = createGithubMock();
    github.paginate.mockResolvedValue([createPullRequest()]);
    expect(
      await getReleaseContext({ github, ...REPOSITORY, sha: "b".repeat(40), ...FILES })
    ).toBeNull();
  });

  it.each(["fork", "base", "manifest", "missing", "empty", "duplicate", "ambiguous"])(
    "отклоняет некорректный релиз: %s",
    async (scenario) => {
      const github = createGithubMock();
      const pullRequest = createPullRequest();
      const files = structuredClone(FILES);
      github.paginate.mockResolvedValue([pullRequest]);
      if (scenario === "fork") {
        pullRequest.head.repo.full_name = "someone/fork";
      } else if (scenario === "base") {
        pullRequest.base.ref = "develop";
      } else if (scenario === "manifest") {
        files.manifest["."] = "1.2.0";
      } else if (scenario === "missing") {
        files.changelog = "# История изменений";
      } else if (scenario === "empty") {
        files.changelog = "## 1.3.0\n### Новое";
      } else if (scenario === "duplicate") {
        files.changelog += "\n## 1.3.0\n- Дубль";
      } else {
        github.paginate.mockResolvedValue([pullRequest, { ...pullRequest, number: 147 }]);
      }
      github.rest.pulls.get.mockResolvedValue({ data: pullRequest });
      await expect(
        getReleaseContext({ github, ...REPOSITORY, sha: SHA, ...files })
      ).rejects.toThrow();
    }
  );

  it("не считает открытый PR выпущенным релизом", async () => {
    const github = createGithubMock();
    github.paginate.mockResolvedValue([createPullRequest()]);
    github.rest.pulls.get.mockResolvedValue({ data: { ...createPullRequest(), merged_at: null } });
    expect(await getReleaseContext({ github, ...REPOSITORY, sha: SHA, ...FILES })).toBeNull();
  });
});
