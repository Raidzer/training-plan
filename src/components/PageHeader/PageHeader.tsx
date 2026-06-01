"use client";

import { Typography } from "antd";
import type { ReactNode } from "react";
import styles from "./PageHeader.module.scss";

type PageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={[styles.header, className].filter(Boolean).join(" ")}>
      <div className={styles.text}>
        <Typography.Title level={3} className={styles.title}>
          {title}
        </Typography.Title>
        {subtitle ? (
          <Typography.Paragraph type="secondary" className={styles.subtitle}>
            {subtitle}
          </Typography.Paragraph>
        ) : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}
