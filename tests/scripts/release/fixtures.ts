import { vi } from "vitest";

export const SHA = "a".repeat(40);
export const REPOSITORY = { owner: "Raidzer", repo: "training-plan" };
export const RELEASE = {
  version: "1.3.0",
  tag: "v1.3.0",
  sha: SHA,
  pullRequestNumber: 146,
  body: "### Новое\n\n- Описание релиза в приложении.",
};
export const FILES = {
  packageVersion: "1.3.0",
  manifest: { ".": "1.3.0" },
  changelog: `# История изменений\n\n## [1.3.0](https://example.com/compare) (2026-10-22)\n\n${RELEASE.body}\n\n## 1.2.0\n- Старое`,
};

export function createPullRequest() {
  return {
    number: 146,
    merged_at: "2026-10-22T10:00:00Z",
    merge_commit_sha: SHA,
    base: { ref: "main", repo: { full_name: "Raidzer/training-plan" } },
    head: { repo: { full_name: "Raidzer/training-plan" } },
    labels: [{ name: "autorelease: pending" }],
  };
}

export function createGithubMock() {
  const notFound = (): Promise<{ data: unknown }> =>
    Promise.reject(Object.assign(new Error("Not Found"), { status: 404 }));
  return {
    paginate: vi.fn().mockResolvedValue([]),
    rest: {
      repos: {
        listPullRequestsAssociatedWithCommit: vi.fn(),
        getReleaseByTag: vi.fn(notFound),
        createRelease: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      },
      pulls: { get: vi.fn().mockResolvedValue({ data: createPullRequest() }) },
      git: {
        getRef: vi.fn(notFound),
        getTag: vi.fn(),
        createRef: vi.fn().mockResolvedValue({ data: {} }),
      },
      issues: {
        addLabels: vi.fn().mockResolvedValue({ data: {} }),
        removeLabel: vi.fn().mockResolvedValue({ data: {} }),
      },
    },
  };
}
