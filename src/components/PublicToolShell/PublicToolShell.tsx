import type { ReactNode } from "react";
import type { PublicToolHref } from "@/shared/constants/publicTools";
import { PublicPageHero, type PublicPageStat } from "../PublicPageHero/PublicPageHero";
import { PublicToolsNavigation } from "../PublicToolsNavigation/PublicToolsNavigation";
import styles from "./PublicToolShell.module.scss";

type PublicToolShellProps = {
  activeHref: PublicToolHref;
  title: string;
  description: string;
  stats: readonly PublicPageStat[];
  children: ReactNode;
};

const PUBLIC_TOOL_TITLE_ID = "public-tool-title";

export function PublicToolShell({
  activeHref,
  title,
  description,
  stats,
  children,
}: PublicToolShellProps) {
  return (
    <section className={styles.page} aria-labelledby={PUBLIC_TOOL_TITLE_ID}>
      <PublicPageHero
        eyebrow="Беговые инструменты"
        title={title}
        description={description}
        titleId={PUBLIC_TOOL_TITLE_ID}
        stats={stats}
      />
      <PublicToolsNavigation activeHref={activeHref} />
      <div className={styles.workspace}>{children}</div>
    </section>
  );
}
