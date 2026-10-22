"use client";

import { Button, Modal } from "antd";
import { useState, type KeyboardEvent } from "react";
import type { ReleaseNotes as ReleaseNotesData } from "@/shared/utils/releaseNotes";
import { RELEASE_NOTES_TEXT } from "./constants/releaseNotesText";
import styles from "./ReleaseNotes.module.scss";

export function ReleaseNotes({
  versionLabel,
  releaseNotes,
}: {
  versionLabel: string;
  releaseNotes: ReleaseNotesData | null;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (!releaseNotes) {
    return <span>{versionLabel}</span>;
  }

  const closeModal = () => setIsOpen(false);
  const handleModalKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") {
      return;
    }

    const buttons =
      event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    const boundary = event.shiftKey ? first : last;
    const destination = event.shiftKey ? last : first;

    // AntD не перехватывает Tab при уходе с последнего элемента документа в браузер.
    if (event.target === boundary && destination) {
      event.preventDefault();
      destination.focus();
    }
  };

  return (
    <>
      <button
        type="button"
        className={styles.versionButton}
        aria-label={`${versionLabel}: ${RELEASE_NOTES_TEXT.open}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        {versionLabel}
      </button>
      <Modal
        title={`${RELEASE_NOTES_TEXT.titlePrefix} ${releaseNotes.version}`}
        open={isOpen}
        onCancel={closeModal}
        width="min(520px, calc(100vw - 24px))"
        centered
        keyboard
        closable={{ "aria-label": RELEASE_NOTES_TEXT.closeDialog }}
        focusable={{ trap: true, focusTriggerAfterClose: true }}
        modalRender={(modal) => <div onKeyDown={handleModalKeyDown}>{modal}</div>}
        classNames={{ body: styles.modalBody }}
        footer={<Button onClick={closeModal}>{RELEASE_NOTES_TEXT.close}</Button>}
      >
        {releaseNotes.sections.map((section, sectionIndex) => (
          <section key={sectionIndex} className={styles.section}>
            {section.title ? <h3 className={styles.sectionTitle}>{section.title}</h3> : null}
            <ul className={styles.items}>
              {section.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </Modal>
    </>
  );
}
