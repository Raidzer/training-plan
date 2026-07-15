import { KeyOutlined } from "@ant-design/icons";
import Link from "next/link";
import { REGISTER_INVITE_NOTICE_TITLE_ID, REGISTER_TEXT } from "../../constants/registerConstants";
import styles from "./RegisterInviteNotice.module.scss";

export function RegisterInviteNotice() {
  return (
    <section className={styles.notice} aria-labelledby={REGISTER_INVITE_NOTICE_TITLE_ID}>
      <span className={styles.icon} aria-hidden="true">
        <KeyOutlined />
      </span>
      <div className={styles.copy}>
        <h2 id={REGISTER_INVITE_NOTICE_TITLE_ID}>{REGISTER_TEXT.inviteNoticeTitle}</h2>
        <p>{REGISTER_TEXT.inviteNotice}</p>
        <p className={styles.help}>{REGISTER_TEXT.inviteHelp}</p>
      </div>
      <Link className={styles.backLink} href="/login">
        {REGISTER_TEXT.backToLogin}
      </Link>
    </section>
  );
}
