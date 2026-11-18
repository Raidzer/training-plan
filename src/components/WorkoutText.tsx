import type { ReactNode } from "react";

const entities: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00a0",
};

function decodeText(text: string): string {
  return text.replace(/&(amp|lt|gt|quot|apos|nbsp|#\d+|#x[\da-f]+);/gi, (_, entity: string) => {
    const name = entity.toLowerCase();
    if (name[0] !== "#") return entities[name];

    const code = name[1] === "x" ? parseInt(name.slice(2), 16) : Number(name.slice(1));
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff)
      ? String.fromCodePoint(code)
      : "\ufffd";
  });
}

export function WorkoutText({ value }: { value: string }): ReactNode {
  const content: ReactNode[] = [];
  let lastWasBreak = false;
  let style: { fontWeight?: "bold"; color?: string } | undefined;

  const appendBreak = (key: number) => {
    if (!lastWasBreak) {
      content.push(<br key={key} />);
      lastWasBreak = true;
    }
  };

  const appendText = (text: string, key: number) => {
    if (!text) return;
    const decoded = decodeText(text);
    content.push(
      style ? (
        <span key={key} style={style}>
          {decoded}
        </span>
      ) : (
        decoded
      )
    );
    lastWasBreak = false;
  };

  const tagPattern = /<[^>]*>/g;
  let offset = 0;
  for (const match of value.matchAll(tagPattern)) {
    const start = match.index ?? 0;
    appendText(value.slice(offset, start), start);
    offset = start + match[0].length;

    const token = match[0];
    const tag = token.match(/^<\/?\s*([a-z][\w:-]*)\b([^>]*)>/i);
    if (!tag) continue;

    const [, name, attributes] = tag;
    const normalizedName = name.toLowerCase();
    const isClosing = /^<\//.test(token);
    if (normalizedName === "br") {
      appendBreak(start);
    } else if (["div", "p", "li", "ul", "ol"].includes(normalizedName)) {
      appendBreak(start);
    } else if (normalizedName === "span" && isClosing) {
      style = undefined;
    } else if (normalizedName === "span" && !isClosing) {
      const styleMatch = attributes.match(/\bstyle\s*=\s*["']([^"']*)["']/i);
      const declarations =
        styleMatch?.[1].split(";").map((item) => item.trim().toLowerCase()) ?? [];
      const fontWeight = declarations.some((item) => /^font-weight:\s*bold$/.test(item))
        ? "bold"
        : undefined;
      const color = declarations
        .map((item) =>
          item.match(
            /^color:\s*(#[\da-f]{6}|rgba\(\d{1,3}, \d{1,3}, \d{1,3}, (?:0\.\d{2}|1\.00)\))$/
          )
        )
        .find(Boolean)?.[1];
      style =
        fontWeight || color
          ? { ...(fontWeight ? { fontWeight } : {}), ...(color ? { color } : {}) }
          : undefined;
    } else if (normalizedName === "b" || normalizedName === "strong") {
      style = isClosing ? undefined : { fontWeight: "bold" };
    }
  }
  appendText(value.slice(offset), offset);
  return content;
}
