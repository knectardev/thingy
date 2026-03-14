export interface ParsedInput {
  content: string;
  token: string | null;
}

const COMPOUND_TOKENS: [RegExp, string][] = [
  [/#lendl[e]?\s+task[.!?,;:]*$/i, "lendl"],
  [/#email\s+chris[.!?,;:]*$/i, "emailchris"],
  [/#email\s+alana[.!?,;:]*$/i, "emailalana"],
];

export function parseInput(text: string): ParsedInput {
  const trimmed = text.trim();

  for (const [pattern, normalized] of COMPOUND_TOKENS) {
    const match = trimmed.match(pattern);
    if (match) {
      return { content: trimmed.slice(0, match.index).trim(), token: normalized };
    }
  }

  const match = trimmed.match(/#(\w+)[.!?,;:]*$/);

  if (!match) {
    return { content: trimmed, token: null };
  }

  const token = match[1].toLowerCase();
  const content = trimmed.slice(0, match.index).trim();

  return { content, token };
}
