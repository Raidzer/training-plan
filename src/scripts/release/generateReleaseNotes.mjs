export async function generateReleaseNotes({ github, owner, repo, base, head, sections }) {
  const commits = await github.paginate(
    github.rest.repos.compareCommitsWithBasehead,
    { owner, repo, basehead: `${base}...${head}`, per_page: 100 },
    ({ data }) => (Array.isArray(data) ? data : data.commits)
  );
  const commitShas = new Set(commits.map(({ sha }) => sha));
  const pullRequests = new Map();

  for (const { sha } of commits) {
    const associated = await github.paginate(
      github.rest.repos.listPullRequestsAssociatedWithCommit,
      {
        owner,
        repo,
        commit_sha: sha,
        per_page: 100,
      }
    );

    for (const pullRequest of associated) {
      if (
        pullRequest.merged_at &&
        commitShas.has(pullRequest.merge_commit_sha) &&
        !pullRequest.labels.some(({ name }) => name.startsWith("autorelease:"))
      ) {
        pullRequests.set(pullRequest.number, pullRequest);
      }
    }
  }

  const groups = new Map();

  for (const { title } of pullRequests.values()) {
    const match = title.trim().match(/^(\w+)(?:\([^\r\n)]+\))?!?:\s*(.*)$/);
    const section = sections.find(({ type, hidden }) => type === match?.[1] && !hidden);

    if (!section) {
      continue;
    }

    const text = match[2].replace(/(?:\s+\((?:#\d+|[a-f\d]{7,40})\))+$/i, "").trim();

    if (text) {
      const items = groups.get(section.section) ?? [];
      items.push(text);
      groups.set(section.section, items);
    }
  }

  const markdown = sections
    .filter(({ section, hidden }) => !hidden && groups.has(section))
    .map(
      ({ section }) =>
        `### ${section}\n\n${groups
          .get(section)
          .map((text) => `- ${text}`)
          .join("\n")}`
    )
    .join("\n\n");

  if (!markdown) {
    throw new Error("В диапазоне релиза нет подходящих заголовков объединённых MR");
  }

  return markdown;
}
