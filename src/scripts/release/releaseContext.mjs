import { getReleaseMarkdown, getReleaseNotes } from "../../shared/utils/releaseNotes.ts";

export async function getReleaseContext({
  github,
  owner,
  repo,
  sha,
  packageVersion,
  manifest,
  changelog,
}) {
  if (!/^[a-f\d]{40}$/i.test(sha)) {
    throw new Error("Для релиза требуется полный SHA проверенного коммита");
  }

  const associated = await github.paginate(github.rest.repos.listPullRequestsAssociatedWithCommit, {
    owner,
    repo,
    commit_sha: sha,
    per_page: 100,
  });
  const candidates = [];

  for (const associatedPullRequest of associated) {
    if (
      !associatedPullRequest.labels.some(
        ({ name }) => name === "autorelease: pending" || name === "autorelease: tagged"
      )
    ) {
      continue;
    }

    const { data: pullRequest } = await github.rest.pulls.get({
      owner,
      repo,
      pull_number: associatedPullRequest.number,
    });

    if (pullRequest.merged_at && pullRequest.merge_commit_sha === sha) {
      candidates.push(pullRequest);
    }
  }

  if (!candidates.length) {
    return null;
  }

  if (candidates.length !== 1) {
    throw new Error(`Для SHA ${sha} найдено несколько релизных PR`);
  }

  const pullRequest = candidates[0];
  const repository = `${owner}/${repo}`.toLowerCase();

  if (
    pullRequest.base.ref !== "main" ||
    pullRequest.base.repo.full_name.toLowerCase() !== repository ||
    pullRequest.head.repo?.full_name.toLowerCase() !== repository
  ) {
    throw new Error("Релизный PR должен быть объединён в main из того же репозитория");
  }

  if (
    !/^\d+\.\d+\.\d+(?:-[a-z\d.-]+)?$/i.test(packageVersion) ||
    manifest["."] !== packageVersion
  ) {
    throw new Error("Версии package.json и release-please manifest не согласованы");
  }

  if (!getReleaseNotes(changelog, packageVersion)) {
    throw new Error(`В CHANGELOG.md нет непустого описания версии ${packageVersion}`);
  }

  return {
    version: packageVersion,
    tag: `v${packageVersion}`,
    sha,
    pullRequestNumber: pullRequest.number,
    body: getReleaseMarkdown(changelog, packageVersion),
  };
}
