import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const COVERAGE_SUMMARY_PATH = resolve("coverage/coverage-summary.json");
const COVERAGE_MARKDOWN_PATH = resolve("coverage/coverage-summary.md");
const GOOD_THRESHOLD_PERCENT = 80;
const WARNING_THRESHOLD_PERCENT = 75;
const FAILURE_THRESHOLD_PERCENT = 70;

const COVERAGE_METRICS = [
  { key: "statements", label: "Операторы" },
  { key: "branches", label: "Ветвления" },
  { key: "functions", label: "Функции" },
  { key: "lines", label: "Строки" },
];

function formatPercentage(percentage) {
  return `${percentage.toFixed(2)}%`;
}

function getMetricStatus(percentage) {
  if (percentage >= GOOD_THRESHOLD_PERCENT) {
    return "Хорошо";
  }

  if (percentage >= WARNING_THRESHOLD_PERCENT) {
    return "Предупреждение";
  }

  if (percentage >= FAILURE_THRESHOLD_PERCENT) {
    return "Риск";
  }

  return "Ошибка";
}

function getOverallStatus(metricResults) {
  const minimumCoverage = Math.min(...metricResults.map((metricResult) => metricResult.percentage));

  if (minimumCoverage >= GOOD_THRESHOLD_PERCENT) {
    return `Хорошо: все метрики не ниже ${GOOD_THRESHOLD_PERCENT}%`;
  }

  if (minimumCoverage >= WARNING_THRESHOLD_PERCENT) {
    return `Предупреждение: минимум одна метрика ниже ${GOOD_THRESHOLD_PERCENT}%`;
  }

  if (minimumCoverage >= FAILURE_THRESHOLD_PERCENT) {
    return `Риск: минимум одна метрика ниже ${WARNING_THRESHOLD_PERCENT}%`;
  }

  return `Ошибка: минимум одна метрика ниже ${FAILURE_THRESHOLD_PERCENT}%`;
}

function getMetricPercentage(totalCoverage, key) {
  const metricCoverage = totalCoverage[key];

  if (!metricCoverage || typeof metricCoverage.pct !== "number") {
    throw new Error(`Coverage metric "${key}" is missing`);
  }

  return metricCoverage.pct;
}

function getMetricResults(totalCoverage) {
  return COVERAGE_METRICS.map((coverageMetric) => {
    const percentage = getMetricPercentage(totalCoverage, coverageMetric.key);

    return {
      ...coverageMetric,
      percentage,
      status: getMetricStatus(percentage),
    };
  });
}

function buildMarkdown(metricResults) {
  const metricRows = metricResults
    .map((metricResult) => {
      return `| ${metricResult.label} | ${formatPercentage(metricResult.percentage)} | ${metricResult.status} |`;
    })
    .join("\n");

  return [
    "## Покрытие тестами",
    "",
    `Общий статус: ${getOverallStatus(metricResults)}`,
    "",
    "| Метрика | Покрытие | Статус |",
    "| --- | ---: | --- |",
    metricRows,
    "",
    "Пороги:",
    `- Хорошо: >= ${GOOD_THRESHOLD_PERCENT}%`,
    `- Предупреждение: >= ${WARNING_THRESHOLD_PERCENT}% и < ${GOOD_THRESHOLD_PERCENT}%`,
    `- Риск: >= ${FAILURE_THRESHOLD_PERCENT}% и < ${WARNING_THRESHOLD_PERCENT}%`,
    `- Ошибка: < ${FAILURE_THRESHOLD_PERCENT}%`,
    "",
  ].join("\n");
}

function writeMarkdown(markdown) {
  mkdirSync(dirname(COVERAGE_MARKDOWN_PATH), { recursive: true });
  writeFileSync(COVERAGE_MARKDOWN_PATH, markdown);
}

function reportAnnotations(metricResults) {
  for (const metricResult of metricResults) {
    const formattedPercentage = formatPercentage(metricResult.percentage);

    if (metricResult.percentage < FAILURE_THRESHOLD_PERCENT) {
      console.log(
        `::error title=Покрытие ${metricResult.label}::Покрытие метрики "${metricResult.label}" равно ${formattedPercentage}. Минимальный порог: ${FAILURE_THRESHOLD_PERCENT}%.`
      );
      continue;
    }

    if (metricResult.percentage < GOOD_THRESHOLD_PERCENT) {
      console.log(
        `::warning title=Покрытие ${metricResult.label}::Покрытие метрики "${metricResult.label}" равно ${formattedPercentage}. Хороший уровень: ${GOOD_THRESHOLD_PERCENT}%.`
      );
    }
  }
}

if (!existsSync(COVERAGE_SUMMARY_PATH)) {
  const markdown = ["## Покрытие тестами", "", "Сводка покрытия не была сгенерирована.", ""].join(
    "\n"
  );

  writeMarkdown(markdown);
  console.log(markdown);
  process.exit(0);
}

const coverageSummary = JSON.parse(readFileSync(COVERAGE_SUMMARY_PATH, "utf8"));
const metricResults = getMetricResults(coverageSummary.total);
const markdown = buildMarkdown(metricResults);

writeMarkdown(markdown);
reportAnnotations(metricResults);
console.log(markdown);
