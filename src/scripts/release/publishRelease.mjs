async function getOptional(request) {
  try {
    return (await request()).data;
  } catch (error) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function checkRelease({ github, owner, repo, release }) {
  const ref = await getOptional(() =>
    github.rest.git.getRef({ owner, repo, ref: `tags/${release.tag}` })
  );
  let object = ref?.object;
  const visitedTags = new Set();

  while (object?.type === "tag") {
    if (visitedTags.has(object.sha) || visitedTags.size >= 10) {
      throw new Error(`Не удалось определить коммит тега ${release.tag}`);
    }
    visitedTags.add(object.sha);
    const { data } = await github.rest.git.getTag({ owner, repo, tag_sha: object.sha });
    object = data.object;
  }

  if (ref && (object?.type !== "commit" || object.sha !== release.sha)) {
    throw new Error(`Тег ${release.tag} уже указывает на другой коммит`);
  }

  const existing = await getOptional(() =>
    github.rest.repos.getReleaseByTag({ owner, repo, tag: release.tag })
  );

  if (existing && (!ref || existing.body !== release.body || existing.draft)) {
    throw new Error(
      `Существующий Release ${release.tag} не совпадает с проверенным описанием или тегом`
    );
  }

  return { hasTag: Boolean(ref), hasRelease: Boolean(existing) };
}

export async function publishRelease(options) {
  const { github, owner, repo, release } = options;
  const state = await checkRelease(options);

  if (!state.hasTag) {
    await github.rest.git.createRef({
      owner,
      repo,
      ref: `refs/tags/${release.tag}`,
      sha: release.sha,
    });
  }

  if (!state.hasRelease) {
    await github.rest.repos.createRelease({
      owner,
      repo,
      tag_name: release.tag,
      target_commitish: release.sha,
      name: release.tag,
      body: release.body,
      draft: false,
      prerelease: release.version.includes("-"),
      generate_release_notes: false,
    });
  }

  await github.rest.issues.addLabels({
    owner,
    repo,
    issue_number: release.pullRequestNumber,
    labels: ["autorelease: tagged"],
  });
  await getOptional(() =>
    github.rest.issues.removeLabel({
      owner,
      repo,
      issue_number: release.pullRequestNumber,
      name: "autorelease: pending",
    })
  );
}
