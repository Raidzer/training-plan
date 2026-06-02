"use client";

import Link from "next/link";
import { useState } from "react";
import type { Mode } from "../ThemeProvider/ThemeProvider";
import { Button, Drawer, Dropdown, Menu, Switch, type MenuProps } from "antd";
import { BulbOutlined, DownOutlined, MenuOutlined, MoonFilled } from "@ant-design/icons";
import styles from "./Header.module.scss";

const usefulItems = [
  {
    key: "pace-calculator",
    label: (
      <Link href="/tools/pace-calculator" className={styles.dropdownLink}>
        Калькулятор расчета темпа и результата на забеге
      </Link>
    ),
  },
  {
    key: "speed-to-pace",
    label: (
      <Link href="/tools/speed-to-pace" className={styles.dropdownLink}>
        Калькулятор перевода скорости в темп
      </Link>
    ),
  },
];

export function Header({ mode, onToggle }: { mode: Mode; onToggle: (next: Mode) => void }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const closeDrawer = () => setDrawerOpen(false);

  const drawerItems: MenuProps["items"] = [
    {
      key: "about",
      label: (
        <Link href="/about" className={styles.drawerLink}>
          О клубе
        </Link>
      ),
    },
    {
      key: "tools",
      label: "Полезное",
      children: [
        {
          key: "pace-calculator",
          label: (
            <Link href="/tools/pace-calculator" className={styles.drawerLink}>
              Калькулятор расчета темпа и результата
            </Link>
          ),
        },
        {
          key: "speed-to-pace",
          label: (
            <Link href="/tools/speed-to-pace" className={styles.drawerLink}>
              Калькулятор перевода скорости в темп
            </Link>
          ),
        },
      ],
    },
    {
      key: "results",
      label: (
        <Link href="/results" className={styles.drawerLink}>
          Результаты клуба
        </Link>
      ),
    },
    {
      key: "dashboard",
      label: (
        <Link href="/dashboard" className={styles.drawerLink}>
          Личный кабинет
        </Link>
      ),
    },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.brand}>
          Беговой клуб СПИРОС
        </Link>
        <nav className={styles.nav}>
          <Link href="/about" className={styles.navLink}>
            О клубе
          </Link>
          <Dropdown menu={{ items: usefulItems }} trigger={["click"]}>
            <Button type="text" className={styles.navButton}>
              Полезное
              <DownOutlined className={styles.navChevron} />
            </Button>
          </Dropdown>
          <Link href="/results" className={styles.navLink}>
            Результаты клуба
          </Link>
          <Link href="/dashboard" className={styles.navLinkPrimary}>
            Личный кабинет
          </Link>
        </nav>
        <div className={styles.controls}>
          <span className={styles.themeLabel}>Тема</span>
          <Switch
            checked={mode === "dark"}
            onChange={(checked) => onToggle(checked ? "dark" : "light")}
            checkedChildren={<MoonFilled />}
            unCheckedChildren={<BulbOutlined />}
          />
        </div>
        <Button
          type="text"
          icon={<MenuOutlined />}
          className={styles.menuButton}
          aria-label="Открыть меню навигации"
          onClick={() => setDrawerOpen(true)}
        />
        <Drawer title="Меню" placement="right" size={320} open={drawerOpen} onClose={closeDrawer}>
          <Menu mode="inline" selectable={false} items={drawerItems} onClick={closeDrawer} />
          <div className={styles.drawerTheme}>
            <span className={styles.drawerThemeText}>Тема</span>
            <Switch
              checked={mode === "dark"}
              onChange={(checked) => onToggle(checked ? "dark" : "light")}
              checkedChildren={<MoonFilled />}
              unCheckedChildren={<BulbOutlined />}
            />
          </div>
        </Drawer>
      </div>
    </header>
  );
}
