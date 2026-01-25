import type { DiaryResultTemplate } from "@/app/actions/diaryTemplates";

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

    const closeIndex = template.indexOf("}}", openIndex);
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
      // Check if matches
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

function renderAST(
  node: ASTNode,
  context: any,
  globalContext: any,
  indexState: { index: number; total: number } | null
): string {
  if (node.type === "ROOT") {
    return node.children.map((c) => renderAST(c, context, globalContext, indexState)).join("");
  }

  if (node.type === "TEXT") {
    return node.value;
  }

  if (node.type === "VAR") {
    const varName = node.name;

    if (varName === "this") {
      return String(context ?? "");
    }
    if (varName === "@index") {
      return String(indexState?.index ?? 0);
    }
    if (varName === "@total") {
      return String(indexState?.total ?? 0);
    }

    const arrMatch = varName.match(/^([a-zA-Z0-9_]+)\[i\]$/);
    if (arrMatch) {
      const key = arrMatch[1];
      const list = globalContext[key];
      if (Array.isArray(list) && indexState) {
        return String(list[indexState.index] ?? "");
      }
      return "";
    }

    let val = context?.[varName];
    if (val === undefined) {
      val = globalContext[varName];
    }

    if (Array.isArray(val)) {
      return val.join("; ");
    }
    return String(val ?? "");
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

  const avgRegex = /{{AVG_TIME\(([a-zA-Z0-9_]+)\)}}/g;
  result = result.replace(avgRegex, (_, listKey) => {
    const list = processedValues[listKey];
    if (Array.isArray(list)) {
      return calculateAverage(list);
    }
    return "";
  });

  const sumRegex = /{{SUM_TIME\(([a-zA-Z0-9_]+)\)}}/g;
  result = result.replace(sumRegex, (_, listKey) => {
    const list = processedValues[listKey];
    if (Array.isArray(list)) {
      return calculateSum(list);
    }
    return "";
  });

  const tokens = betterTokenize(result);
  const ast = parse(tokens);

  return renderAST(ast, processedValues, processedValues, null);
}
