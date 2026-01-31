export interface TemplateWithPattern {
  matchPattern: string | null;
  [key: string]: any;
}

export function matchTemplates<T extends TemplateWithPattern>(
  templates: T[],
  taskText: string
): T[] {
  const allMatches: { template: T; index: number; length: number }[] = [];

  templates.forEach((t) => {
    if (!t.matchPattern) return;

    const patterns = t.matchPattern
      .split(";")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const foundIndicesForTemplate = new Set<number>();

    patterns.forEach((pattern) => {
      const addMatch = (index: number, length: number) => {
        if (!foundIndicesForTemplate.has(index)) {
          allMatches.push({ template: t, index, length });
          foundIndicesForTemplate.add(index);
        }
      };

      try {
        let smartPattern = pattern.trim();
        let isAnchored = false;

        if (smartPattern.startsWith("^")) {
          isAnchored = true;
          smartPattern = smartPattern.substring(1);
        }

        smartPattern = smartPattern.replace(/[.+?^${}()|[\]\\#*]/g, "\\$&");

        smartPattern = smartPattern.replace(/\s+/g, "\\s+");

        const rangeValidators: { index: number; min: number; max: number }[] = [];
        let groupIndex = 1;

        smartPattern = smartPattern.replace(
          /\\#\\{(\d+)-(\d+)\\}/g,
          (_, min: string, max: string) => {
            rangeValidators.push({ index: groupIndex++, min: Number(min), max: Number(max) });
            return "(\\d+)";
          }
        );

        smartPattern = smartPattern.replace(/\\#/g, "\\d+");
        smartPattern = smartPattern.replace(/\\\*/g, ".*");

        if (isAnchored) {
          smartPattern = "^" + smartPattern;
        }

        const smartRegex = new RegExp(smartPattern, "gi");
        let match: RegExpExecArray | null;
        while ((match = smartRegex.exec(taskText)) !== null) {
          const currentMatch = match;
          const isValid = rangeValidators.every((v) => {
            const val = parseInt(currentMatch[v.index], 10);
            return !isNaN(val) && val >= v.min && val <= v.max;
          });

          if (isValid) {
            addMatch(currentMatch.index, currentMatch[0].length);
          }
        }
      } catch (e) {
        console.error("Error matching smart pattern", pattern, e);
      }

      try {
        const regex = new RegExp(pattern, "gi");
        let match;
        while ((match = regex.exec(taskText)) !== null) {
          addMatch(match.index, match[0].length);
        }
      } catch (e) {}
    });
  });

  allMatches.sort((a, b) => {
    if (a.index !== b.index) {
      return a.index - b.index;
    }
    return b.length - a.length;
  });

  const uniqueMatches: T[] = [];
  let lastMatchEnd = -1;

  allMatches.forEach((m) => {
    if (m.index >= lastMatchEnd) {
      uniqueMatches.push(m.template);
      lastMatchEnd = m.index + m.length;
    }
  });

  return uniqueMatches;
}
