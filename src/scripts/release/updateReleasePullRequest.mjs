import { getReleaseMarkdown } from "../../shared/utils/releaseNotes.ts";
import { generateReleaseNotes } from "./generateReleaseNotes.mjs";

function replaceReleaseSection(document, version, replacement, isBody = false) {
  const location = isBody ? "body релизного PR" : "CHANGELOG.md";
  const markdown = getReleaseMarkdown(document, version);

  if (!markdown) {
    throw new Error(`В ${location} нет непустого описания версии ${version}`);
  }

  let notes = markdown;

  if (isBody) {
    const boundary = markdown.search(/^(?:<\/details>|---)[\t ]*\r?$/m);

    if (boundary === -1) {
      throw new Error(`В body релизного PR не найдена граница описания версии ${version}`);
    }

    notes = markdown.slice(0, boundary).trim();

    if (!notes) {
      throw new Error(`В body релизного PR нет непустого описания версии ${version}`);
    }
  }

  const headings = [...document.matchAll(/^##[\t ]+(.+)\r?$/gm)];
  const heading = headings.find((entry) => {
    const headingVersion = entry[1].match(/^(?:\[([^\]]+)\]\([^\n]*?\)|(\S+))(?:\s|$)/);
    return (headingVersion?.[1] ?? headingVersion?.[2]) === version;
  });
  const start = document.indexOf(markdown, heading.index + heading[0].length);
  const newline = document.includes("\r\n") ? "\r\n" : "\n";

  return {
    notes: notes.replaceAll("\r\n", "\n"),
    document:
      document.slice(0, start) +
      replacement.replaceAll("\n", newline) +
      document.slice(start + notes.length),
  };
}

async function readReleaseFile(github, repository, filePath, ref) {
  const { data } = await github.rest.repos.getContent({ ...repository, path: filePath, ref });

  if (
    data.type !== "file" ||
    data.encoding !== "base64" ||
    typeof data.content !== "string" ||
    !data.sha
  ) {
    throw new Error(`GitHub не вернул содержимое файла ${filePath}`);
  }

  return { content: Buffer.from(data.content, "base64").toString("utf8"), sha: data.sha };
}

export async function updateReleasePullRequest({
  github,
  owner,
  repo,
  sha,
  pullRequestNumber,
  config,
  manifest,
}) {
  const repository = { owner, repo };
  const repositoryName = `${owner}/${repo}`.toLowerCase();

  if (!pullRequestNumber) {
    const openPullRequests = await github.paginate(github.rest.pulls.list, {
      ...repository,
      state: "open",
      base: "main",
      per_page: 100,
    });
    const pending = openPullRequests.filter(
      (pullRequest) =>
        pullRequest.state === "open" &&
        pullRequest.base.ref === "main" &&
        pullRequest.head.repo?.full_name.toLowerCase() === repositoryName &&
        pullRequest.labels.some(({ name }) => name === "autorelease: pending")
    );

    if (!pending.length) {
      return;
    }

    if (pending.length > 1) {
      throw new Error("Найдено несколько открытых релизных PR с меткой autorelease: pending");
    }

    pullRequestNumber = pending[0].number;
  }

  const { data: pullRequest } = await github.rest.pulls.get({
    ...repository,
    pull_number: pullRequestNumber,
  });

  if (
    pullRequest.state !== "open" ||
    pullRequest.merged_at ||
    pullRequest.base.ref !== "main" ||
    pullRequest.base.repo.full_name.toLowerCase() !== repositoryName ||
    pullRequest.head.repo?.full_name.toLowerCase() !== repositoryName
  ) {
    throw new Error("Релизный PR должен быть открыт в main из того же репозитория");
  }

  if (pullRequest.base.sha !== sha) {
    throw new Error("SHA main в релизном PR не совпадает с проверенным SHA запуска CI");
  }

  const [changelog, releaseManifest] = await Promise.all([
    readReleaseFile(github, repository, "src/releases/CHANGELOG.md", pullRequest.head.sha),
    readReleaseFile(github, repository, ".release-please-manifest.json", pullRequest.head.sha),
  ]);
  const version = JSON.parse(releaseManifest.content)["."];

  if (!/^\d+\.\d+\.\d+(?:-[a-z\d.-]+)?$/i.test(version) || version === manifest["."]) {
    throw new Error("В manifest релизного PR нет новой корректной версии");
  }

  const notes = await generateReleaseNotes({
    github,
    ...repository,
    base:
      config["last-release-sha"] ?? (manifest["."] ? `v${manifest["."]}` : config["bootstrap-sha"]),
    head: sha,
    sections: config["changelog-sections"],
  });
  const updatedChangelog = replaceReleaseSection(changelog.content, version, notes);
  const updatedBody = replaceReleaseSection(pullRequest.body ?? "", version, notes, true);

  if (
    updatedChangelog.notes !== notes &&
    updatedBody.notes !== updatedChangelog.notes &&
    updatedBody.notes !== notes
  ) {
    throw new Error(`Фрагмент описания версии ${version} в body PR не совпадает с CHANGELOG.md`);
  }

  if (updatedChangelog.document !== changelog.content) {
    await github.rest.repos.createOrUpdateFileContents({
      ...repository,
      path: "src/releases/CHANGELOG.md",
      message: "chore(release): обновлено описание релиза из заголовков PR",
      content: Buffer.from(updatedChangelog.document).toString("base64"),
      sha: changelog.sha,
      branch: pullRequest.head.ref,
    });
  }

  if (updatedBody.document !== pullRequest.body) {
    await github.rest.pulls.update({
      ...repository,
      pull_number: pullRequestNumber,
      body: updatedBody.document,
    });
  }
}
