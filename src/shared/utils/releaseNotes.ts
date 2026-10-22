export type ReleaseNotes = {
  version: string;
  sections: { title: string | null; items: string[] }[];
};

export function getReleaseMarkdown(changelog: string, version: string): string | null {
  const headings = [...changelog.matchAll(/^##[\t ]+(.+)\r?$/gm)];
  const matches = headings.filter((heading) => {
    const headingVersion = heading[1].match(/^(?:\[([^\]]+)\]\([^\n]*?\)|(\S+))(?:\s|$)/);
    return (headingVersion?.[1] ?? headingVersion?.[2]) === version;
  });

  if (matches.length > 1) {
    throw new Error(`В CHANGELOG.md несколько описаний версии ${version}`);
  }

  const heading = matches[0];

  if (!heading) {
    return null;
  }

  const nextHeading = headings[headings.indexOf(heading) + 1];
  return changelog.slice(heading.index + heading[0].length, nextHeading?.index).trim();
}

function toPlainText(markdown: string): string {
  return markdown
    .replace(/!?\[([^\]]+)\]\([^\n]*?\)/g, "$1")
    .replace(/(\*\*|__|~~|`+)(.*?)\1/g, "$2")
    .replace(/(?<!\w)([*_])(?=\S)(.+?)\1(?!\w)/g, "$2")
    .trim();
}

export function getReleaseNotes(
  changelog: string,
  appVersion: string,
  gitSha?: string
): ReleaseNotes | null {
  if (appVersion === "dev") {
    return null;
  }

  const version =
    gitSha && /^[a-f\d]{7,40}$/i.test(gitSha) && appVersion.endsWith(`-${gitSha}`)
      ? appVersion.slice(0, -gitSha.length - 1)
      : appVersion;
  const markdown = getReleaseMarkdown(changelog, version);

  if (!markdown) {
    return null;
  }

  const sections: ReleaseNotes["sections"] = [];
  let section: ReleaseNotes["sections"][number] = { title: null, items: [] };
  sections.push(section);

  for (const line of markdown.split(/\r?\n/)) {
    const title = line.match(/^###[\t ]+(.+)/);
    const item = line.match(/^[-*][\t ]+(.+)/);

    if (title) {
      section = { title: toPlainText(title[1]) || null, items: [] };
      sections.push(section);
    } else if (item) {
      const text = toPlainText(item[1]);

      if (text) {
        section.items.push(text);
      }
    } else if (/^[\t ]+\S/.test(line) && section.items.length) {
      const lastIndex = section.items.length - 1;
      section.items[lastIndex] += ` ${toPlainText(line)}`;
    }
  }

  const populatedSections = sections.filter(({ items }) => items.length > 0);
  return populatedSections.length ? { version, sections: populatedSections } : null;
}
