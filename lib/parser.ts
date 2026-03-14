export interface ParsedInput {
  content: string;
  token: string | null;
}

export function parseInput(text: string): ParsedInput {
  const trimmed = text.trim();
  const match = trimmed.match(/#(\w+)[.!?,;:]*$/);

  if (!match) {
    return { content: trimmed, token: null };
  }

  const token = match[1].toLowerCase();
  const content = trimmed.slice(0, match.index).trim();

  return { content, token };
}
