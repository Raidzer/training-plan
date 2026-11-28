import type { ReactNode } from "react";
import styles from "./LegalDocument.module.scss";

type LegalDocumentProps = {
  title: string;
  version: string;
  children: ReactNode;
};

export function LegalDocument({ title, version, children }: LegalDocumentProps) {
  return (
    <main className={styles.document} aria-labelledby="legal-document-title">
      <header className={styles.heading}>
        <h1 id="legal-document-title">{title}</h1>
        <p>
          Редакция <time dateTime={version}>{version}</time>
        </p>
      </header>
      {children}
    </main>
  );
}
