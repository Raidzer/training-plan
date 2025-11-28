import Link from "antd/es/typography/Link";
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
