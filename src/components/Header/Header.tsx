"use client";

import { DownOutlined, MenuOutlined } from "@ant-design/icons";
import { Button, Drawer, Dropdown, Menu, type MenuProps } from "antd";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import appIcon from "@/app/icon.png";
import styles from "./Header.module.scss";

const TOOL_LINKS = [
  {
    key: "result-equivalent",
    href: "/tools/result-equivalent",
    label: "Калькулятор прогноза результата",
  },
  {
    key: "pace-calculator",
    href: "/tools/pace-calculator",
    label: "Калькулятор расчета темпа и результата на забеге",
  },
  {
    key: "speed-to-pace",
    href: "/tools/speed-to-pace",
    label: "Калькулятор перевода скорости в темп",
  },
] as const;

const usefulItems: NonNullable<MenuProps["items"]> = TOOL_LINKS.map((tool) => ({
  key: tool.href,
  label: (
    <Link href={tool.href} className={styles.dropdownLink}>
      {tool.label}
    </Link>
  ),
}));

const drawerItems: NonNullable<MenuProps["items"]> = [
  {
    key: "/about",
    label: (
      <Link href="/about" className={styles.drawerLink}>
        О клубе
      </Link>
    ),
  },
  {
    key: "tools",
    label: "Полезное",
    children: TOOL_LINKS.map((tool) => ({
      key: tool.href,
      label: (
        <Link href={tool.href} className={styles.drawerLink}>
          {tool.label}
        </Link>
      ),
    })),
  },
  {
    key: "/results",
    label: (
      <Link href="/results" className={styles.drawerLink}>
        Результаты клуба
      </Link>
    ),
  },
  {
    key: "/dashboard",
    label: (
      <Link href="/dashboard" className={styles.drawerLink}>
        Личный кабинет
      </Link>
    ),
  },
];

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const toolsActive = pathname.startsWith("/tools/");

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.brand} aria-label="Беговой клуб СПИРОС">
          <Image
            className={styles.brandIcon}
            src={appIcon}
            width={32}
            height={32}
            alt=""
            aria-hidden="true"
          />
          <span className={styles.brandWord}>СПИРОС</span>
        </Link>

        <nav className={styles.nav} aria-label="Основная навигация">
          <Link
            href="/about"
            className={clsx(styles.navLink, pathname === "/about" && styles.navLinkActive)}
            aria-current={pathname === "/about" ? "page" : undefined}
          >
            О клубе
          </Link>

          <Dropdown menu={{ items: usefulItems, selectedKeys: [pathname] }} trigger={["click"]}>
            <Button
              type="text"
              className={clsx(styles.navButton, toolsActive && styles.navLinkActive)}
            >
              Полезное
              <DownOutlined className={styles.navChevron} />
            </Button>
          </Dropdown>

          <Link
            href="/results"
            className={clsx(styles.navLink, pathname === "/results" && styles.navLinkActive)}
            aria-current={pathname === "/results" ? "page" : undefined}
          >
            Результаты клуба
          </Link>

          <Link
            href="/dashboard"
            className={clsx(
              styles.navLinkPrimary,
              pathname === "/dashboard" && styles.navLinkPrimaryActive
            )}
            aria-current={pathname === "/dashboard" ? "page" : undefined}
          >
            Личный кабинет
          </Link>
        </nav>

        <Button
          type="text"
          icon={<MenuOutlined />}
          className={styles.menuButton}
          aria-label="Открыть меню навигации"
          onClick={() => setDrawerOpen(true)}
        />

        <Drawer
          title="Навигация"
          placement="right"
          size={320}
          open={drawerOpen}
          onClose={closeDrawer}
        >
          <Menu
            mode="inline"
            selectedKeys={[pathname]}
            defaultOpenKeys={toolsActive ? ["tools"] : []}
            items={drawerItems}
            onClick={closeDrawer}
          />
        </Drawer>
      </div>
    </header>
  );
}
