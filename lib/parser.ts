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

  // Voice-to-text often spells out "hashtag" or "keyword" literally.
  // Replace the last occurrence with # so token matching works normally.
  // Also collapse any spaces after the last # (e.g., "# email chris" → "#email chris").
  const input = trimmed
    .replace(/^(.*)\b(?:hashtag|keyword)\s+/i, "$1#")
    .replace(/^(.*)#\s+/s, "$1#");

  for (const [pattern, tok] of COMPOUND_TOKENS) {
    const match = input.match(pattern);
    if (match) {
      return { content: input.slice(0, match.index).trim(), token: tok };
    }
  }

  const match = input.match(/#(\w+)[.!?,;:]*$/);

  if (!match) {
    return { content: trimmed, token: null };
  }

  const token = match[1].toLowerCase();
  const content = input.slice(0, match.index).trim();

  return { content, token };
}
