import type { DiaryResultTemplate } from "@/shared/types/diary-templates";

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

  let h = Math.floor(totalSeconds / 3600);
  let m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  let sInt = Math.floor(s);
  let ms = Math.round((s - sInt) * 10);

  if (ms === 10) {
    ms = 0;
    sInt += 1;
    if (sInt >= 60) {
      sInt = 0;
      m += 1;
      if (m >= 60) {
        m = 0;
        h += 1;
      }
    }
  }

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

type TokenType = "TEXT" | "OPEN_BLOCK" | "CLOSE_BLOCK" | "VAR";
type Token = {
  type: TokenType;
  value: string;
  tagType?: "each" | "repeat" | "if";
  arg?: string;
};

type ASTNode =
  | { type: "ROOT"; children: ASTNode[] }
  | { type: "TEXT"; value: string }
  | { type: "VAR"; name: string }
  | { type: "BLOCK"; tagType: "each" | "repeat" | "if"; arg: string; children: ASTNode[] };

type IndexState = { index: number; total: number } | null;

function findTagCloseIndex(template: string, startIndex: number): number {
  let depth = 0;
  let cursor = startIndex;

  while (cursor < template.length - 1) {
    const pair = template.slice(cursor, cursor + 2);
    if (pair === "{{") {
      depth += 1;
      cursor += 2;
      continue;
    }

    if (pair === "}}") {
      depth -= 1;
      if (depth === 0) {
        return cursor;
      }
      cursor += 2;
      continue;
    }

    cursor += 1;
  }

  return -1;
}

function betterTokenize(template: string): Token[] {
  const tokens: Token[] = [];
  let cursor = 0;

  while (cursor < template.length) {
    const openIndex = template.indexOf("{{", cursor);
    if (openIndex === -1) {
      tokens.push({ type: "TEXT", value: template.substring(cursor) });
      break;
    }

    if (openIndex > cursor) {
      tokens.push({ type: "TEXT", value: template.substring(cursor, openIndex) });
    }

    const closeIndex = findTagCloseIndex(template, openIndex);
    if (closeIndex === -1) {
      tokens.push({ type: "TEXT", value: template.substring(openIndex) });
      break;
    }

    const tagContent = template.substring(openIndex + 2, closeIndex).trim();
    cursor = closeIndex + 2;

    if (tagContent.startsWith("#")) {
      const parts = tagContent.substring(1).trim().split(/\s+/);
      const tagName = parts[0];
      const arg = parts.slice(1).join(" ");
      if (["each", "repeat", "if"].includes(tagName)) {
        tokens.push({
          type: "OPEN_BLOCK",
          value: tagName,
          tagType: tagName as "each" | "repeat" | "if",
          arg,
        });
      } else {
        tokens.push({ type: "TEXT", value: `{{${tagContent}}}` });
      }
    } else if (tagContent.startsWith("/")) {
      const tagName = tagContent.substring(1).trim();
      if (["each", "repeat", "if"].includes(tagName)) {
        tokens.push({ type: "CLOSE_BLOCK", value: tagName });
      } else {
        tokens.push({ type: "TEXT", value: `{{${tagContent}}}` });
      }
    } else {
      tokens.push({ type: "VAR", value: tagContent });
    }
  }
  return tokens;
}

function parse(tokens: Token[]): ASTNode {
  const root: ASTNode = { type: "ROOT", children: [] };
  const stack: ASTNode[] = [root];

  for (const token of tokens) {
    const currentContainer = stack[stack.length - 1];

    if (token.type === "TEXT") {
      if ("children" in currentContainer) {
        currentContainer.children.push({ type: "TEXT", value: token.value });
      }
    } else if (token.type === "VAR") {
      if ("children" in currentContainer) {
        currentContainer.children.push({ type: "VAR", name: token.value });
      }
    } else if (token.type === "OPEN_BLOCK") {
      const newNode: ASTNode = {
        type: "BLOCK",
        tagType: token.tagType!,
        arg: token.arg || "",
        children: [],
      };
      if ("children" in currentContainer) {
        currentContainer.children.push(newNode);
      }
      stack.push(newNode);
    } else if (token.type === "CLOSE_BLOCK") {
      if (stack.length > 1) {
        const openBlock = stack[stack.length - 1];
        if (openBlock.type === "BLOCK" && openBlock.tagType === token.value) {
          stack.pop();
        }
      }
    }
  }

  return root;
}

function unwrapMustacheExpression(expression: string): string {
  let result = expression.trim();
  while (result.startsWith("{{") && result.endsWith("}}")) {
    result = result.slice(2, -2).trim();
  }
  return result;
}

function getContextValueByKey(key: string, context: any, globalContext: any): any {
  if (!key) {
    return undefined;
  }

  const contextValue = context?.[key];
  if (contextValue !== undefined) {
    return contextValue;
  }

  return globalContext[key];
}

function splitFunctionArgs(argsString: string): string[] {
  if (!argsString.trim()) {
    return [];
  }

  const args: string[] = [];
  let currentArg = "";
  let parenDepth = 0;
  let mustacheDepth = 0;
  let cursor = 0;

  while (cursor < argsString.length) {
    const pair = argsString.slice(cursor, cursor + 2);
    if (pair === "{{") {
      mustacheDepth += 1;
      currentArg += pair;
      cursor += 2;
      continue;
    }

    if (pair === "}}") {
      if (mustacheDepth > 0) {
        mustacheDepth -= 1;
      }
      currentArg += pair;
      cursor += 2;
      continue;
    }

    const char = argsString[cursor];
    if (char === "(") {
      parenDepth += 1;
      currentArg += char;
      cursor += 1;
      continue;
    }

    if (char === ")") {
      if (parenDepth > 0) {
        parenDepth -= 1;
      }
      currentArg += char;
      cursor += 1;
      continue;
    }

    if (char === "," && parenDepth === 0 && mustacheDepth === 0) {
      args.push(currentArg.trim());
      currentArg = "";
      cursor += 1;
      continue;
    }

    currentArg += char;
    cursor += 1;
  }

  const trimmedArg = currentArg.trim();
  if (trimmedArg) {
    args.push(trimmedArg);
  }

  return args;
}

type ParsedFunctionCall = {
  name: string;
  args: string[];
};

function parseFunctionCall(expression: string): ParsedFunctionCall | null {
  const normalizedExpression = unwrapMustacheExpression(expression);
  if (!normalizedExpression.endsWith(")")) {
    return null;
  }

  const openParenIndex = normalizedExpression.indexOf("(");
  if (openParenIndex <= 0) {
    return null;
  }

  const functionName = normalizedExpression.slice(0, openParenIndex).trim();
  if (!/^[A-Z_]+$/.test(functionName)) {
    return null;
  }

  const argsString = normalizedExpression.slice(openParenIndex + 1, -1);
  return {
    name: functionName,
    args: splitFunctionArgs(argsString),
  };
}

function parseNumericValue(value: any): number | null {
  if (typeof value === "number") {
    if (Number.isNaN(value)) {
      return null;
    }
    return value;
  }

  if (typeof value === "string") {
    const parsedValue = parseFloat(value.replace(",", "."));
    if (Number.isNaN(parsedValue)) {
      return null;
    }
    return parsedValue;
  }

  return null;
}

function parseDistanceValue(value: any): number {
  if (value === undefined || value === null) {
    return Number.NaN;
  }

  if (typeof value === "number") {
    return value;
  }

  const rawValue = String(value).trim().toLowerCase();
  if (!rawValue) {
    return Number.NaN;
  }

  const numericValue = parseFloat(rawValue.replace(",", ".").replace(/[^\d.]/g, ""));

  if (Number.isNaN(numericValue)) {
    return Number.NaN;
  }

  const hasKilometers = rawValue.includes("km") || rawValue.includes("км");
  const hasMeters = rawValue.includes("m") || rawValue.includes("м");
  if (hasMeters && !hasKilometers) {
    return numericValue / 1000;
  }

  if (!hasMeters && !hasKilometers && numericValue >= 1000) {
    return numericValue / 1000;
  }

  return numericValue;
}

function evaluateExpression(
  expression: string,
  context: any,
  globalContext: any,
  indexState: IndexState,
  fallbackToLiteral: boolean
): any {
  const normalizedExpression = unwrapMustacheExpression(expression);
  if (!normalizedExpression) {
    return undefined;
  }

  if (normalizedExpression === "this") {
    return context;
  }

  if (normalizedExpression === "@index") {
    if (!indexState) {
      return 0;
    }
    return indexState.index;
  }

  if (normalizedExpression === "@total") {
    if (!indexState) {
      return 0;
    }
    return indexState.total;
  }

  const functionCall = parseFunctionCall(normalizedExpression);
  if (functionCall) {
    return evaluateFunctionCall(functionCall, context, globalContext, indexState);
  }

  const indexedByIterationMatch = normalizedExpression.match(/^([a-zA-Z0-9_]+)\[i\]$/);
  if (indexedByIterationMatch) {
    const listKey = indexedByIterationMatch[1];
    const listValue = getContextValueByKey(listKey, context, globalContext);
    if (Array.isArray(listValue) && indexState) {
      return listValue[indexState.index];
    }
    return "";
  }

  const indexedByNumberMatch = normalizedExpression.match(/^([a-zA-Z0-9_]+)\[(\d+)\]$/);
  if (indexedByNumberMatch) {
    const listKey = indexedByNumberMatch[1];
    const itemIndex = parseInt(indexedByNumberMatch[2], 10);
    const listValue = getContextValueByKey(listKey, context, globalContext);
    if (Array.isArray(listValue)) {
      return listValue[itemIndex - 1];
    }
    return "";
  }

  const contextValue = getContextValueByKey(normalizedExpression, context, globalContext);
  if (contextValue !== undefined) {
    return contextValue;
  }

  if (fallbackToLiteral) {
    return normalizedExpression;
  }

  return undefined;
}

function collectTimeValuesFromArgs(
  args: string[],
  context: any,
  globalContext: any,
  indexState: IndexState
): string[] {
  const collectedValues: string[] = [];

  args.forEach((arg) => {
    const resolvedValue = evaluateExpression(arg, context, globalContext, indexState, true);

    if (Array.isArray(resolvedValue)) {
      resolvedValue.forEach((item) => {
        if (item === undefined || item === null) {
          return;
        }

        const normalizedItem = String(item).trim();
        if (!normalizedItem) {
          return;
        }

        collectedValues.push(normalizedItem);
      });
      return;
    }

    if (resolvedValue === undefined || resolvedValue === null) {
      return;
    }

    const normalizedValue = String(resolvedValue).trim();
    if (!normalizedValue) {
      return;
    }

    collectedValues.push(normalizedValue);
  });

  return collectedValues;
}

function collectNumericValuesFromArgs(
  args: string[],
  context: any,
  globalContext: any,
  indexState: IndexState
): number[] {
  const collectedValues: number[] = [];

  args.forEach((arg) => {
    const resolvedValue = evaluateExpression(arg, context, globalContext, indexState, true);

    if (Array.isArray(resolvedValue)) {
      resolvedValue.forEach((item) => {
        const numericValue = parseNumericValue(item);
        if (numericValue === null) {
          return;
        }
        collectedValues.push(numericValue);
      });
      return;
    }

    const numericValue = parseNumericValue(resolvedValue);
    if (numericValue === null) {
      return;
    }
    collectedValues.push(numericValue);
  });

  return collectedValues;
}

function evaluateFunctionCall(
  functionCall: ParsedFunctionCall,
  context: any,
  globalContext: any,
  indexState: IndexState
): string {
  const { name, args } = functionCall;

  if (name === "AVG_TIME") {
    const valuesList = collectTimeValuesFromArgs(args, context, globalContext, indexState);
    return calculateAverage(valuesList);
  }

  if (name === "SUM_TIME") {
    const valuesList = collectTimeValuesFromArgs(args, context, globalContext, indexState);
    return calculateSum(valuesList);
  }

  if (name === "AVG_NUM") {
    const numericValues = collectNumericValuesFromArgs(args, context, globalContext, indexState);
    if (numericValues.length === 0) {
      return "";
    }

    const sum = numericValues.reduce((accumulator, value) => accumulator + value, 0);
    const avg = sum / numericValues.length;
    return (Math.round(avg * 10) / 10).toString();
  }

  if (name === "SUM_NUM") {
    const numericValues = collectNumericValuesFromArgs(args, context, globalContext, indexState);
    if (numericValues.length === 0) {
      return "";
    }

    const sum = numericValues.reduce((accumulator, value) => accumulator + value, 0);
    return sum.toString();
  }

  if (name === "PACE") {
    if (args.length === 0) {
      return "";
    }

    const timeArgExpression = args[0];
    const timeValue = evaluateExpression(
      timeArgExpression,
      context,
      globalContext,
      indexState,
      true
    );

    let distanceValue: any;
    if (args.length > 1) {
      distanceValue = evaluateExpression(args[1], context, globalContext, indexState, true);
    } else {
      const timeArgKey = unwrapMustacheExpression(timeArgExpression);
      const directTimeValue = getContextValueByKey(timeArgKey, context, globalContext);
      if (directTimeValue !== undefined) {
        distanceValue = getContextValueByKey(`${timeArgKey}_weight`, context, globalContext);
      }
    }

    const totalSeconds = timeToSeconds(String(timeValue ?? ""));
    const distance = parseDistanceValue(distanceValue);
    if (!distance || distance <= 0) {
      return "";
    }

    const secondsPerKm = totalSeconds / distance;
    return secondsToTime(secondsPerKm);
  }

  if (name === "AVG_HEIGHT") {
    if (args.length === 0) {
      return "";
    }

    const heightArgExpression = args[0];
    const heightValue = evaluateExpression(
      heightArgExpression,
      context,
      globalContext,
      indexState,
      true
    );

    let distanceValue: any;
    if (args.length > 1) {
      distanceValue = evaluateExpression(args[1], context, globalContext, indexState, true);
    } else {
      const heightArgKey = unwrapMustacheExpression(heightArgExpression);
      const directHeightValue = getContextValueByKey(heightArgKey, context, globalContext);
      if (directHeightValue !== undefined) {
        distanceValue = getContextValueByKey(`${heightArgKey}_weight`, context, globalContext);
      }
    }

    const parsedHeight = parseNumericValue(heightValue);
    const distance = parseDistanceValue(distanceValue);

    if (parsedHeight === null) {
      return "";
    }

    if (!distance || distance <= 0) {
      return "";
    }

    const avgHeight = parsedHeight / distance;
    return (Math.round(avgHeight * 10) / 10).toString().replace(".", ",");
  }

  return "";
}

function renderAST(
  node: ASTNode,
  context: any,
  globalContext: any,
  indexState: IndexState
): string {
  if (node.type === "ROOT") {
    return node.children.map((c) => renderAST(c, context, globalContext, indexState)).join("");
  }

  if (node.type === "TEXT") {
    return node.value;
  }

  if (node.type === "VAR") {
    const resolvedValue = evaluateExpression(node.name, context, globalContext, indexState, false);
    if (Array.isArray(resolvedValue)) {
      return resolvedValue.join("; ");
    }
    return String(resolvedValue ?? "");
  }

  if (node.type === "BLOCK") {
    if (node.tagType === "each") {
      const listKey = node.arg;
      let list = context?.[listKey];
      if (list === undefined) list = globalContext[listKey];

      if (!Array.isArray(list) || list.length === 0) return "";

      return list
        .map((item: any, idx: number) => {
          return node.children
            .map((child) =>
              renderAST(child, item, globalContext, { index: idx, total: list.length })
            )
            .join("");
        })
        .join("");
    }

    if (node.tagType === "repeat") {
      let count = parseInt(node.arg);
      if (isNaN(count)) {
        const val = context?.[node.arg] ?? globalContext[node.arg];
        count = parseInt(val) || 0;
      }

      let output = "";
      for (let i = 0; i < count; i++) {
        output += node.children
          .map((child) => renderAST(child, context, globalContext, { index: i, total: count }))
          .join("");
      }
      return output;
    }

    if (node.tagType === "if") {
      const varName = node.arg;
      let val = context?.[varName];
      if (val === undefined) val = globalContext[varName];

      if (val) {
        return node.children
          .map((child) => renderAST(child, context, globalContext, indexState))
          .join("");
      }
      return "";
    }
  }

  return "";
}

export function processTemplate(template: DiaryResultTemplate, values: BlockValues): string {
  let result = template.outputTemplate || "";
  result = result.replace(/^[ \t]*({{[#\/](if|each|repeat).*?}})[ \t]*(\r\n|\n)/gm, "$1");
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

    if ((field as any).weight !== undefined && (field as any).weight !== null) {
      processedValues[`${key}_weight`] = (field as any).weight;
    }
  });

  const tokens = betterTokenize(result);
  const ast = parse(tokens);

  return renderAST(ast, processedValues, processedValues, null);
}
