import clsx from "clsx";
import Link from "next/link";
import { PUBLIC_TOOL_LINKS, type PublicToolHref } from "@/shared/constants/publicTools";
import styles from "./PublicToolsNavigation.module.scss";

type PublicToolsNavigationProps = {
  activeHref: PublicToolHref;
};

export function PublicToolsNavigation({ activeHref }: PublicToolsNavigationProps) {
  return (
    <nav className={styles.navigation} aria-label="Переключение беговых инструментов">
      <p className={styles.label}>Инструменты</p>
      <div className={styles.links}>
        {PUBLIC_TOOL_LINKS.map((tool, index) => {
          const isActive = tool.href === activeHref;

          return (
            <Link
              className={clsx(styles.link, isActive && styles.active)}
              href={tool.href}
              aria-current={isActive ? "page" : undefined}
              key={tool.key}
            >
              <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
              <span className={styles.linkCopy}>
                <strong>{tool.shortLabel}</strong>
                <span>{tool.description}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
