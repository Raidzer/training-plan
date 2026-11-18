import { describe, expect, it, vi } from "vitest";
import { generateReleaseNotes } from "@/scripts/release/generateReleaseNotes.mjs";
import { REPOSITORY, SHA } from "./fixtures";

const SECTIONS = [
  { type: "feat", section: "Новое", hidden: false },
  { type: "fix", section: "Исправления", hidden: false },
  { type: "style", section: "Внешний вид", hidden: false },
];

function createPullRequest(number: number, title: string, mergeCommitSha: string) {
  return {
    number,
    title,
    merge_commit_sha: mergeCommitSha,
    merged_at: "2026-11-17T10:00:00Z" as string | null,
    labels: [] as { name: string }[],
  };
}

function createGithub(commits: Record<string, ReturnType<typeof createPullRequest>[]>) {
  const compareCommitsWithBasehead = vi.fn();
  const listPullRequestsAssociatedWithCommit = vi.fn();
  return {
    rest: { repos: { compareCommitsWithBasehead, listPullRequestsAssociatedWithCommit } },
    paginate: vi.fn(async (method, parameters, mapResponse) => {
      if (method === compareCommitsWithBasehead) {
        const items = Object.keys(commits).map((sha) => ({
          sha,
          commit: { message: "feat(diary): текст отдельного коммита, который нельзя выводить" },
        }));
        return mapResponse({ data: { commits: items } });
      }
      return commits[parameters.commit_sha];
    }),
  };
}

function generate(github: ReturnType<typeof createGithub>, sections = SECTIONS) {
  return generateReleaseNotes({
    github,
    ...REPOSITORY,
    base: "v1.5.0",
    head: SHA,
    sections,
  });
}

describe("generateReleaseNotes", () => {
  it("берёт один заголовок MR для нескольких коммитов и merge, включая вложенный релиз", async () => {
    const feature = createPullRequest(168, "feat(profile): добавлена загрузка фото", "merge");
    const release = createPullRequest(169, "Release/1.6.0", "release");
    const old = createPullRequest(157, "feat: старое изменение", "old");
    const open = { ...createPullRequest(170, "feat: открытый MR", "direct"), merged_at: null };
    const technical = createPullRequest(171, "chore: обновлены зависимости", "technical");
    const autorelease = {
      ...createPullRequest(172, "fix: служебный релизный MR", "bot"),
      labels: [{ name: "autorelease: tagged" }],
    };
    const github = createGithub({
      first: [feature, release],
      second: [feature, release],
      merge: [feature, release],
      squash: [createPullRequest(166, "fix(diary): исправлено сохранение", "squash"), release],
      style: [createPullRequest(165, "style(plan): увеличен шрифт", "style"), release],
      release: [release],
      direct: [old, open, release],
      technical: [technical, release],
      bot: [autorelease],
    });

    expect(await generate(github)).toBe(
      "### Новое\n\n- добавлена загрузка фото\n\n" +
        "### Исправления\n\n- исправлено сохранение\n\n" +
        "### Внешний вид\n\n- увеличен шрифт"
    );
    expect(github.paginate).toHaveBeenCalledWith(
      github.rest.repos.compareCommitsWithBasehead,
      { ...REPOSITORY, basehead: `v1.5.0...${SHA}`, per_page: 100 },
      expect.any(Function)
    );
  });

  it.each([
    ["feat(diary): показывать пробег обуви", "показывать пробег обуви"],
    ["feat: добавлен дневник", "добавлен дневник"],
    ["feat(profile)!: изменён профиль (#123) (728a871)", "изменён профиль"],
    ["feat!: изменён формат", "изменён формат"],
    ["feat: учёт сна 7 часов и номер #123", "учёт сна 7 часов и номер #123"],
  ])("оставляет пользовательский текст заголовка %s", async (title, expected) => {
    const github = createGithub({ merge: [createPullRequest(1, title, "merge")] });
    expect(await generate(github)).toBe(`### Новое\n\n- ${expected}`);
  });

  it("не включает скрытые типы и не создаёт пустые разделы", async () => {
    const github = createGithub({
      feature: [createPullRequest(1, "feat: добавлена обувь", "feature")],
      fix: [createPullRequest(2, "fix: внутреннее исправление", "fix")],
    });
    expect(
      await generate(github, [SECTIONS[0], { ...SECTIONS[1], hidden: true }, SECTIONS[2]])
    ).toBe("### Новое\n\n- добавлена обувь");
  });

  it("останавливает генерацию без подходящих заголовков вместо подстановки коммитов", async () => {
    const github = createGithub({
      direct: [],
      release: [createPullRequest(1, "Release/1.6.0", "release")],
      empty: [createPullRequest(2, "feat(profile):   ", "empty")],
    });
    await expect(generate(github)).rejects.toThrow(/заголовк.*MR/i);
  });

  it("не скрывает ошибку GitHub API и не возвращает частичное описание", async () => {
    const github = createGithub({ merge: [createPullRequest(1, "feat: дневник", "merge")] });
    github.paginate.mockRejectedValueOnce(new Error("GitHub unavailable"));
    await expect(generate(github)).rejects.toThrow("GitHub unavailable");
  });

  it("читает все страницы сравнения при нормализации ответа Octokit в массив", async () => {
    const github = createGithub({
      first: [createPullRequest(1, "feat: первый MR", "first")],
      second: [createPullRequest(2, "fix: второй MR", "second")],
    });
    const paginate = github.paginate.getMockImplementation()!;
    github.paginate.mockImplementation(async (method, parameters, mapResponse) => {
      if (method === github.rest.repos.compareCommitsWithBasehead) {
        return ["first", "second"].flatMap((sha) => mapResponse({ data: [{ sha }] }));
      }
      return paginate(method, parameters, mapResponse);
    });
    expect(await generate(github)).toBe(
      "### Новое\n\n- первый MR\n\n### Исправления\n\n- второй MR"
    );
  });
});
