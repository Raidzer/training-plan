"use client";

import { Typography } from "antd";
import clsx from "clsx";
import type { ReactNode } from "react";
import styles from "./ProfileSection.module.scss";

type ProfileSectionProps = {
  id: string;
  index: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
};

export function ProfileSection({
  id,
  index,
  title,
  description,
  children,
  className,
}: ProfileSectionProps) {
  const titleId = `${id}-title`;

  return (
    <section id={id} className={clsx(styles.section, className)} aria-labelledby={titleId}>
      <header className={styles.header}>
        <span className={styles.index} aria-hidden>
          {index}
        </span>
        <div className={styles.heading}>
          <Typography.Title id={titleId} level={2} className={styles.title}>
            {title}
          </Typography.Title>
          <Typography.Paragraph type="secondary" className={styles.description}>
            {description}
          </Typography.Paragraph>
        </div>
      </header>
      <div className={styles.content}>{children}</div>
    </section>
  );
}
