"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import styles from "./results.module.scss";
import type {
  ResultsDistanceKey,
  ResultsEntry,
} from "../results.utils";

type DistanceTab = {
  key: ResultsDistanceKey;
  label: string;
};

type ResultsClientProps = {
  results: ResultsEntry[];
};

const DISTANCE_TABS: readonly DistanceTab[] = [
  { key: "5k", label: "5 км" },
  { key: "10k", label: "10 км" },
  { key: "21k", label: "21 км" },
  { key: "42k", label: "42 км" },
];

const EPSILON = 0.0001;

const formatDate = (value: string) => {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }
  return `${day}.${month}.${year}`;
};

const buildMetaItems = (item: ResultsEntry) => {
  const meta: string[] = [];
  if (item.raceName) {
    meta.push(item.raceName);
  }
  if (item.raceCity) {
    meta.push(item.raceCity);
  }
  if (item.recordDate) {
    meta.push(formatDate(item.recordDate));
  }
  return meta;
};

const sortResults = (items: ResultsEntry[]) =>
  [...items].sort((left, right) => {
    if (left.timeSeconds !== right.timeSeconds) {
      return left.timeSeconds - right.timeSeconds;
    }
    if (left.recordDate !== right.recordDate) {
      return left.recordDate.localeCompare(right.recordDate);
    }
    if (left.athlete !== right.athlete) {
      return left.athlete.localeCompare(right.athlete, "ru");
    }
    return left.id - right.id;
  });

const splitRecords = (items: ResultsEntry[]) => {
  if (items.length === 0) {
    return { records: [], rest: [] };
  }
  const bestTime = items[0].timeSeconds;
  const records = items.filter(
    (item) => Math.abs(item.timeSeconds - bestTime) <= EPSILON
  );
  const rest = items.filter(
    (item) => Math.abs(item.timeSeconds - bestTime) > EPSILON
  );
  return { records, rest };
};

export function ResultsClient({ results }: ResultsClientProps) {
  const [activeDistance, setActiveDistance] =
    useState<ResultsDistanceKey>("5k");
  const panelId = "results-panel";
  const activeLabel =
    DISTANCE_TABS.find((tab) => tab.key === activeDistance)?.label ?? "";

  const { records, rest, sortedResults } = useMemo(() => {
    const filtered = results.filter(
      (item) => item.distanceKey === activeDistance
    );
    const sortedResults = sortResults(filtered);
    const { records, rest } = splitRecords(sortedResults);
    return { records, rest, sortedResults };
  }, [activeDistance, results]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Результаты клуба</h1>
        <p className={styles.subtitle}>
          Быстрые финиши участников по ключевым дистанциям. Сортировка внутри
          каждой дистанции - от рекордов к полному списку.
        </p>
      </header>

      <div className={styles.tabs} role="tablist" aria-label="Выбор дистанции">
        {DISTANCE_TABS.map((tab) => {
          const isActive = tab.key === activeDistance;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={`results-tab-${tab.key}`}
              aria-selected={isActive}
              aria-controls={panelId}
              className={clsx(styles.tabButton, isActive && styles.tabActive)}
              onClick={() => {
                setActiveDistance(tab.key);
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <section
        className={styles.panel}
        id={panelId}
        role="tabpanel"
        aria-labelledby={`results-tab-${activeDistance}`}
      >
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Дистанция {activeLabel}</h2>
          <p className={styles.panelSubtitle}>
            Результаты отсортированы по времени - от быстрого к медленному.
          </p>
        </div>

        {sortedResults.length === 0 ? (
          <p className={styles.empty}>
            Пока нет результатов для этой дистанции.
          </p>
        ) : (
          <>
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Рекорды</h3>
                <p className={styles.sectionSubtitle}>
                  Самые быстрые результаты на выбранной дистанции.
                </p>
              </div>
              <div className={styles.recordsGrid}>
                {records.map((item) => {
                  const metaItems = buildMetaItems(item);
                  return (
                    <article className={styles.recordCard} key={item.id}>
                      <span className={styles.recordBadge}>Рекорд</span>
                      <div className={styles.recordMain}>
                        <span className={styles.recordTime}>
                          {item.timeText}
                        </span>
                        <span className={styles.recordAthlete}>
                          {item.athlete}
                        </span>
                      </div>
                      <div className={styles.recordMeta}>
                        {metaItems.map((value, index) => (
                          <span key={`${item.id}-record-meta-${index}`}>
                            {value}
                          </span>
                        ))}
                        {item.protocolUrl ? (
                          <a
                            className={styles.protocolLink}
                            href={item.protocolUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Протокол
                          </a>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {rest.length > 0 ? (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Остальные результаты</h3>
                  <p className={styles.sectionSubtitle}>
                    Полный список финишей на дистанции.
                  </p>
                </div>
                <ol className={styles.resultsList}>
                  {rest.map((item, index) => {
                    const rank = records.length + index + 1;
                    const metaItems = buildMetaItems(item);
                    return (
                      <li className={styles.resultRow} key={item.id}>
                        <div className={styles.rankBadge}>#{rank}</div>
                        <div className={styles.resultBody}>
                          <div className={styles.resultHeader}>
                            <span className={styles.resultTime}>
                              {item.timeText}
                            </span>
                            <span className={styles.resultAthlete}>
                              {item.athlete}
                            </span>
                          </div>
                          <div className={styles.resultMeta}>
                            {metaItems.map((value, metaIndex) => (
                              <span key={`${item.id}-meta-${metaIndex}`}>
                                {value}
                              </span>
                            ))}
                            {item.protocolUrl ? (
                              <a
                                className={styles.protocolLink}
                                href={item.protocolUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Протокол
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
