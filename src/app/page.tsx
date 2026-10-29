import Image from "next/image";
import Link from "next/link";
import headerLogo from "@/components/Header/HeaderLogo.svg";
import { PUBLIC_TOOL_LINKS } from "@/shared/constants/publicTools";
import styles from "./page.module.scss";

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <h1 className={styles.title}>
          <Image className={styles.logo} src={headerLogo} width={496} height={80} alt="СПИРОС" />
        </h1>
        <p className={styles.description}>Дневник тренировок и полезные инструменты для бегунов.</p>
        <Link href="/dashboard" className={styles.dashboardLink}>
          Личный кабинет
        </Link>
      </header>

      <section className={styles.tools} aria-label="Инструменты для бегунов">
        {PUBLIC_TOOL_LINKS.map((tool) => (
          <Link
            href={tool.href}
            className={styles.toolLink}
            key={tool.key}
            aria-label={tool.shortLabel}
          >
            <article>
              <h2 className={styles.toolTitle}>
                {tool.shortLabel}
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M4 10h12m-5-5 5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </h2>
              <p className={styles.toolDescription}>{tool.description}</p>
            </article>
          </Link>
        ))}
      </section>
    </div>
  );
}
