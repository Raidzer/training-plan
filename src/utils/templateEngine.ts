import type { DiaryResultTemplate } from "@/app/actions/diaryTemplates";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BlockValues = Record<string, any>;

function timeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const raw = timeStr.trim().replace(",", ".");

  if (raw.includes(":")) {
    const parts = raw.split(":");
    if (parts.length === 3) {
      return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
    }
    if (parts.length === 2) {
      return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    }
  }
  const val = parseFloat(raw);
  return isNaN(val) ? 0 : val;
}

function secondsToTime(totalSeconds: number): string {
  if (isNaN(totalSeconds)) return "";

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const sInt = Math.floor(s);
  const ms = Math.round((s - sInt) * 10); // 1 decimal place

  let result = "";
  if (h > 0) result += `${h}:`;

  result += `${m}:${sInt.toString().padStart(2, "0")}`;

  if (ms > 0) {
    result += `,${ms}`;
  }

  return result;
}

function calculateAverage(list: string[]): string {
  if (list.length === 0) return "";
  let total = 0;
  let count = 0;

  for (const item of list) {
    const seconds = timeToSeconds(item);
    if (seconds > 0) {
      total += seconds;
      count++;
    }
  }

  if (count === 0) return "";
  return secondsToTime(total / count);
}

function calculateSum(list: string[]): string {
  if (list.length === 0) return "";
  let total = 0;

  for (const item of list) {
    total += timeToSeconds(item);
  }

  return secondsToTime(total);
}

export function processTemplate(template: DiaryResultTemplate, values: BlockValues): string {
  let result = template.outputTemplate || "";
  const schema = (template.schema as { key: string; type: string }[]) || [];

  const processedValues: Record<string, any> = { ...values };

  schema.forEach((field: { key: string; type: string }) => {
    const key = field.key;
    const val = values[key];
    if (field.type === "list") {
      if (typeof val === "string") {
        const list = val
          .split(/[;\n]+/)
          .map((s) => s.trim())
          .filter(Boolean);
        processedValues[key] = list;
      } else if (Array.isArray(val)) {
        processedValues[key] = val;
      } else {
        processedValues[key] = [];
      }
    }
  });

  const loopRegex = /{{#each\s+([a-zA-Z0-9_]+)}}([\s\S]*?){{\/each}}/g;

  result = result.replace(loopRegex, (_, listKey, content) => {
    const list = processedValues[listKey];
    if (!Array.isArray(list) || list.length === 0) {
      return "";
    }

    let loopOutput = "";
    list.forEach((item, index) => {
      let itemContent = content;

      itemContent = itemContent.replace(/{{this}}/g, item);

      itemContent = itemContent.replace(/{{([a-zA-Z0-9_]+)\[i\]}}/g, (_: string, key: string) => {
        const otherList = processedValues[key];
        if (Array.isArray(otherList)) {
          return otherList[index] || "";
        }
        return "";
      });

      loopOutput += itemContent;
    });

    return loopOutput;
  });

  const avgRegex = /{{AVG\(([a-zA-Z0-9_]+)\)}}/g;
  result = result.replace(avgRegex, (_, listKey) => {
    const list = processedValues[listKey];
    if (Array.isArray(list)) {
      return calculateAverage(list);
    }
    return "";
  });

  const sumRegex = /{{SUM\(([a-zA-Z0-9_]+)\)}}/g;
  result = result.replace(sumRegex, (_, listKey) => {
    const list = processedValues[listKey];
    if (Array.isArray(list)) {
      return calculateSum(list);
    }
    return "";
  });

  const calculations =
    (template.calculations as { formula: string; args: string[]; key: string }[]) || [];
  calculations.forEach((calc) => {
    try {
      if (
        calc.formula === "PACE" ||
        calc.formula === "MULT" ||
        calc.formula === "DIV" ||
        calc.formula === "SUB"
      ) {
        const args = (calc.args as string[]) || [];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const argVals = args.map((k: string) => processedValues[k]);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const computed = "";
      }
    } catch {
      // ignore
    }
  });

  Object.keys(processedValues).forEach((key) => {
    const val = processedValues[key];
    const regex = new RegExp(`{{${key}}}`, "g");

    if (Array.isArray(val)) {
      result = result.replace(regex, val.join("; "));
    } else {
      result = result.replace(regex, String(val ?? ""));
    }
  });

  return result;
}
