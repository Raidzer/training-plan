import { readFile } from "node:fs/promises";
import path from "node:path";
import { getReleaseNotes } from "@/shared/utils/releaseNotes";

export async function getCurrentReleaseNotes() {
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || "dev";

  if (appVersion === "dev") {
    return null;
  }

  const changelog = await readFile(path.join(process.cwd(), "src/releases/CHANGELOG.md"), "utf8");
  return getReleaseNotes(changelog, appVersion, process.env.NEXT_PUBLIC_GIT_SHA);
}
