import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const COVERAGE_SUMMARY_PATH = resolve("coverage/coverage-summary.json");
const COVERAGE_MARKDOWN_PATH = resolve("coverage/coverage-summary.md");
const GOOD_THRESHOLD_PERCENT = 80;
const WARNING_THRESHOLD_PERCENT = 75;
const FAILURE_THRESHOLD_PERCENT = 70;

const COVERAGE_METRICS = [
  { key: "statements", label: "Statements" },
  { key: "branches", label: "Branches" },
  { key: "functions", label: "Functions" },
  { key: "lines", label: "Lines" },
];

function formatPercentage(percentage) {
  return `${percentage.toFixed(2)}%`;
}

function getMetricStatus(percentage) {
  if (percentage >= GOOD_THRESHOLD_PERCENT) {
    return "Good";
  }

  if (percentage >= WARNING_THRESHOLD_PERCENT) {
    return "Warning";
  }

  if (percentage >= FAILURE_THRESHOLD_PERCENT) {
    return "At risk";
  }

  return "Fail";
}

function getOverallStatus(metricResults) {
  const minimumCoverage = Math.min(...metricResults.map((metricResult) => metricResult.percentage));

  if (minimumCoverage >= GOOD_THRESHOLD_PERCENT) {
    return `Good: all metrics are at least ${GOOD_THRESHOLD_PERCENT}%`;
  }

  if (minimumCoverage >= WARNING_THRESHOLD_PERCENT) {
    return `Warning: at least one metric is below ${GOOD_THRESHOLD_PERCENT}%`;
  }

  if (minimumCoverage >= FAILURE_THRESHOLD_PERCENT) {
    return `At risk: at least one metric is below ${WARNING_THRESHOLD_PERCENT}%`;
  }

  return `Fail: at least one metric is below ${FAILURE_THRESHOLD_PERCENT}%`;
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
    "## Coverage",
    "",
    `Overall status: ${getOverallStatus(metricResults)}`,
    "",
    "| Metric | Coverage | Status |",
    "| --- | ---: | --- |",
    metricRows,
    "",
    "Thresholds:",
    `- Good: >= ${GOOD_THRESHOLD_PERCENT}%`,
    `- Warning: >= ${WARNING_THRESHOLD_PERCENT}% and < ${GOOD_THRESHOLD_PERCENT}%`,
    `- At risk: >= ${FAILURE_THRESHOLD_PERCENT}% and < ${WARNING_THRESHOLD_PERCENT}%`,
    `- Fail: < ${FAILURE_THRESHOLD_PERCENT}%`,
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
        `::error title=Coverage ${metricResult.label}::${metricResult.label} coverage is ${formattedPercentage}. Required minimum is ${FAILURE_THRESHOLD_PERCENT}%.`
      );
      continue;
    }

    if (metricResult.percentage < GOOD_THRESHOLD_PERCENT) {
      console.log(
        `::warning title=Coverage ${metricResult.label}::${metricResult.label} coverage is ${formattedPercentage}. Good threshold is ${GOOD_THRESHOLD_PERCENT}%.`
      );
    }
  }
}

if (!existsSync(COVERAGE_SUMMARY_PATH)) {
  const markdown = ["## Coverage", "", "Coverage summary was not generated.", ""].join("\n");

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
