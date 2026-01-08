import Link from "next/link";
import type { Mode } from "../ThemeProvider/ThemeProvider";
import { Switch } from "antd";
import { BulbOutlined, MoonFilled } from "@ant-design/icons";
import styles from "./Header.module.scss";

export function Header({
  mode,
  onToggle,
}: {
  mode: Mode;
  onToggle: (next: Mode) => void;
}) {
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
      </div>
    </header>
  );
}
