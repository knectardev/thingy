export interface ParsedInput {
  content: string;
  token: string | null;
  contextToken: string | null;
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
    .replace(/^(.*)#\s+/, "$1#");

  for (const [pattern, tok] of COMPOUND_TOKENS) {
    const match = input.match(pattern);
    if (match) {
      return { content: input.slice(0, match.index).trim(), token: tok, contextToken: null };
    }
  }

  const allTags = [...input.matchAll(/#(\w+)[.!?,;:]*/g)];

  if (allTags.length === 0) {
    return { content: trimmed, token: null, contextToken: null };
  }

  // When #feature appears anywhere among the tags, treat it as the primary
  // token and use the other tag as the context for fuzzy repo routing.
  const featureIdx = allTags.findIndex((t) => t[1].toLowerCase() === "feature");

  if (featureIdx !== -1 && allTags.length >= 2) {
    const featureTag = allTags[featureIdx];
    const contextTag = allTags.find((_, i) => i !== featureIdx)!;
    const contextToken = contextTag[1].toLowerCase();

    // Remove both hashtags from content (higher index first to preserve positions)
    const tagsToRemove = [featureTag, contextTag].sort(
      (a, b) => b.index! - a.index!
    );
    let content = input;
    for (const tag of tagsToRemove) {
      content = content.slice(0, tag.index) + content.slice(tag.index! + tag[0].length);
    }

    return { content: content.trim(), token: "feature", contextToken };
  }

  const lastTag = allTags[allTags.length - 1];
  const token = lastTag[1].toLowerCase();
  const content = input.slice(0, lastTag.index).trim();
  return { content, token, contextToken: null };
}
