"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import styles from "./results.module.scss";

type DistanceKey = "5k" | "10k" | "21k" | "42k";

type DistanceTab = {
  key: DistanceKey;
  label: string;
};

type ResultEntry = {
  id: string;
  distanceKey: DistanceKey;
  athlete: string;
  timeSeconds: number;
  date: string;
  event: string;
  location: string;
};

const DISTANCE_TABS: readonly DistanceTab[] = [
  { key: "5k", label: "5 км" },
  { key: "10k", label: "10 км" },
  { key: "21k", label: "21 км" },
  { key: "42k", label: "42 км" },
];

const RESULTS: ResultEntry[] = [
  {
    id: "5k-1",
    distanceKey: "5k",
    athlete: "Егор Орлов",
    timeSeconds: 922,
    date: "2024-05-12",
    event: "Весенний старт",
    location: "Москва",
  },
  {
    id: "5k-2",
    distanceKey: "5k",
    athlete: "Никита Романов",
    timeSeconds: 965,
    date: "2023-09-03",
    event: "Осенний забег",
    location: "Казань",
  },
  {
    id: "5k-3",
    distanceKey: "5k",
    athlete: "Илья Климов",
    timeSeconds: 1000,
    date: "2024-06-08",
    event: "Городской кросс",
    location: "Санкт-Петербург",
  },
  {
    id: "5k-4",
    distanceKey: "5k",
    athlete: "Артем Гончаров",
    timeSeconds: 1032,
    date: "2023-04-29",
    event: "Ночной старт",
    location: "Нижний Новгород",
  },
  {
    id: "10k-1",
    distanceKey: "10k",
    athlete: "Михаил Сорокин",
    timeSeconds: 1930,
    date: "2024-04-21",
    event: "Лига бега",
    location: "Москва",
  },
  {
    id: "10k-2",
    distanceKey: "10k",
    athlete: "Антон Ковалев",
    timeSeconds: 1985,
    date: "2023-08-20",
    event: "Кубок города",
    location: "Екатеринбург",
  },
  {
    id: "10k-3",
    distanceKey: "10k",
    athlete: "Дмитрий Шевцов",
    timeSeconds: 2060,
    date: "2024-09-14",
    event: "Северный старт",
    location: "Архангельск",
  },
  {
    id: "10k-4",
    distanceKey: "10k",
    athlete: "Сергей Нестеров",
    timeSeconds: 2150,
    date: "2023-05-06",
    event: "Весенний полумарафон",
    location: "Тула",
  },
  {
    id: "21k-1",
    distanceKey: "21k",
    athlete: "Павел Данилов",
    timeSeconds: 4235,
    date: "2024-10-05",
    event: "Полумарафон столицы",
    location: "Москва",
  },
  {
    id: "21k-2",
    distanceKey: "21k",
    athlete: "Игорь Мельников",
    timeSeconds: 4330,
    date: "2023-07-16",
    event: "Белые ночи",
    location: "Санкт-Петербург",
  },
  {
    id: "21k-3",
    distanceKey: "21k",
    athlete: "Алексей Котов",
    timeSeconds: 4485,
    date: "2024-06-23",
    event: "Летний полумарафон",
    location: "Самара",
  },
  {
    id: "21k-4",
    distanceKey: "21k",
    athlete: "Роман Зорин",
    timeSeconds: 4680,
    date: "2023-09-30",
    event: "Осенний полумарафон",
    location: "Сочи",
  },
  {
    id: "42k-1",
    distanceKey: "42k",
    athlete: "Кирилл Петров",
    timeSeconds: 9020,
    date: "2024-09-15",
    event: "Марафон столицы",
    location: "Москва",
  },
  {
    id: "42k-2",
    distanceKey: "42k",
    athlete: "Александр Морозов",
    timeSeconds: 9400,
    date: "2023-10-08",
    event: "Балтийский марафон",
    location: "Калининград",
  },
  {
    id: "42k-3",
    distanceKey: "42k",
    athlete: "Виталий Седов",
    timeSeconds: 9910,
    date: "2024-04-28",
    event: "Весенний марафон",
    location: "Ярославль",
  },
  {
    id: "42k-4",
    distanceKey: "42k",
    athlete: "Денис Попов",
    timeSeconds: 10350,
    date: "2023-05-21",
    event: "Волжский марафон",
    location: "Нижний Новгород",
  },
];

const formatTime = (totalSeconds: number) => {
  if (!Number.isFinite(totalSeconds)) {
    return "00:00:00";
  }
  if (totalSeconds <= 0) {
    return "00:00:00";
  }
  const safeSeconds = Math.floor(totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
};

const formatDate = (value: string) => {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }
  return `${day}.${month}.${year}`;
};

const sortResults = (items: ResultEntry[]) =>
  [...items].sort((left, right) => {
    if (left.timeSeconds !== right.timeSeconds) {
      return left.timeSeconds - right.timeSeconds;
    }
    if (left.date !== right.date) {
      return left.date.localeCompare(right.date);
    }
    if (left.athlete !== right.athlete) {
      return left.athlete.localeCompare(right.athlete, "ru");
    }
    return left.id.localeCompare(right.id);
  });

const splitRecords = (items: ResultEntry[]) => {
  if (items.length === 0) {
    return { records: [], rest: [] };
  }
  const bestTime = items[0].timeSeconds;
  const records = items.filter((item) => item.timeSeconds === bestTime);
  const rest = items.filter((item) => item.timeSeconds !== bestTime);
  return { records, rest };
};

export function ResultsClient() {
  const [activeDistance, setActiveDistance] = useState<DistanceKey>("5k");
  const panelId = "results-panel";
  const activeLabel =
    DISTANCE_TABS.find((tab) => tab.key === activeDistance)?.label ?? "";

  const { records, rest, sortedResults } = useMemo(() => {
    const filtered = RESULTS.filter(
      (item) => item.distanceKey === activeDistance
    );
    const sortedResults = sortResults(filtered);
    const { records, rest } = splitRecords(sortedResults);
    return { records, rest, sortedResults };
  }, [activeDistance]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Результаты клуба</h1>
        <p className={styles.subtitle}>
          Быстрые финиши участников по ключевым дистанциям. Сортировка внутри
          каждой дистанции — от рекордов к полному списку.
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
            Результаты отсортированы по времени — от быстрого к медленному.
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
                {records.map((item) => (
                  <article className={styles.recordCard} key={item.id}>
                    <span className={styles.recordBadge}>Рекорд</span>
                    <div className={styles.recordMain}>
                      <span className={styles.recordTime}>
                        {formatTime(item.timeSeconds)}
                      </span>
                      <span className={styles.recordAthlete}>
                        {item.athlete}
                      </span>
                    </div>
                    <div className={styles.recordMeta}>
                      <span>{item.event}</span>
                      <span>{item.location}</span>
                      <span>{formatDate(item.date)}</span>
                    </div>
                  </article>
                ))}
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
                    return (
                      <li className={styles.resultRow} key={item.id}>
                        <div className={styles.rankBadge}>#{rank}</div>
                        <div className={styles.resultBody}>
                          <div className={styles.resultHeader}>
                            <span className={styles.resultTime}>
                              {formatTime(item.timeSeconds)}
                            </span>
                            <span className={styles.resultAthlete}>
                              {item.athlete}
                            </span>
                          </div>
                          <div className={styles.resultMeta}>
                            <span>{item.event}</span>
                            <span>{item.location}</span>
                            <span>{formatDate(item.date)}</span>
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
