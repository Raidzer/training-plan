export function getBuildVersion(packageVersion, releaseVersion, sha) {
  if (!/^[a-f\d]{40}$/i.test(sha)) {
    throw new Error("Для сборки требуется полный SHA проверенного коммита");
  }

  if (!/^\d+\.\d+\.\d+(?:-[a-z\d.-]+)?$/i.test(packageVersion)) {
    throw new Error("В package.json указана некорректная версия сборки");
  }

  if (releaseVersion && releaseVersion !== packageVersion) {
    throw new Error("Версия релиза не совпадает с версией package.json");
  }

  return releaseVersion || `${packageVersion}-${sha.slice(0, 7)}`;
}

export async function inspectVersionImage(image, sha, run) {
  if (!/^[a-f\d]{40}$/i.test(sha)) {
    throw new Error("Для проверки образа требуется полный SHA проверенного коммита");
  }

  let manifestResult;

  try {
    manifestResult = await run("docker", [
      "buildx",
      "imagetools",
      "inspect",
      image,
      "--format",
      "{{json .Manifest}}",
    ]);
  } catch (error) {
    if (!isMissingImageError(error, image)) {
      throw error;
    }

    try {
      await run("docker", ["buildx", "imagetools", "inspect", image, "--raw"]);
    } catch (rawError) {
      if (isMissingImageError(rawError, image)) {
        return null;
      }

      throw rawError;
    }

    throw error;
  }

  const digest = JSON.parse(manifestResult.stdout)?.digest;

  if (!/^sha256:[a-f\d]{64}$/.test(digest)) {
    throw new Error(`Docker вернул некорректный digest образа ${image}`);
  }

  const repository = image.split("@")[0].replace(/:[^/:]+$/, "");
  const imageResult = await run("docker", [
    "buildx",
    "imagetools",
    "inspect",
    `${repository}@${digest}`,
    "--format",
    "{{json .Image}}",
  ]);
  const images = JSON.parse(imageResult.stdout);

  for (const platform of ["linux/amd64", "linux/arm64"]) {
    if (images?.[platform]?.config?.Labels?.["org.opencontainers.image.revision"] !== sha) {
      throw new Error(`Образ ${image} для ${platform} отсутствует или не соответствует SHA ${sha}`);
    }
  }

  return digest;
}

function isMissingImageError(error, image) {
  const errorText = `${error?.stderr ?? ""}\n${error?.message ?? ""}`;

  return (
    /\bmanifest unknown\b/i.test(errorText) ||
    errorText
      .split(/\r?\n/)
      .some((line) => line.trim().replace(/^ERROR:\s*/, "") === `${image}: not found`)
  );
}
