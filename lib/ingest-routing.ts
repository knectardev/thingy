import { parseInput } from "@/lib/parser";

export type UiRoutingMode = "github" | "email" | "spreadsheet";

export interface UiRoutingPayload {
  mode: UiRoutingMode;
  secondary?: string;
}

export function resolveIngestRouting(
  text: string,
  routing?: UiRoutingPayload | null
) {
  const parsed = parseInput(text);
  if (!routing?.mode) {
    return parsed;
  }

  switch (routing.mode) {
    case "github":
      return {
        content: parsed.content,
        token: "feature",
        contextToken: routing.secondary?.trim().toLowerCase() || null,
      };
    case "email": {
      const s = routing.secondary?.toLowerCase();
      const token = s === "alana" ? "emailalana" : "emailchris";
      return { content: parsed.content, token, contextToken: null };
    }
    case "spreadsheet": {
      const s = routing.secondary?.toLowerCase();
      const token = s === "tshirt" ? "tshirt" : "idea";
      return { content: parsed.content, token, contextToken: null };
    }
  }
}
