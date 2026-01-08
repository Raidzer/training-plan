import Link from "next/link";
import type { Mode } from "../ThemeProvider/ThemeProvider";
import { Button, Dropdown, Switch } from "antd";
import { BulbOutlined, DownOutlined, MoonFilled } from "@ant-design/icons";
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
        Калькулятор перевода скорости (км/ч, м/с) в темп (мин/км, мин/миля)
      </Link>
    ),
  },
];

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
      </div>
    </header>
  );
}
