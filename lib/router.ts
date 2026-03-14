import { log } from "@/lib/logger";
import { handleGitHub } from "@/lib/handlers/github";
import { handleSheets } from "@/lib/handlers/sheets";
import { handleUncategorized } from "@/lib/handlers/uncategorized";

export type Handler = (content: string, thingyId: number) => Promise<void>;

const handlerMap: Record<string, Handler> = {
  task: handleGitHub,
  idea: handleSheets,
};

export async function route(
  content: string,
  token: string | null,
  thingyId: number
): Promise<void> {
  const resolvedToken = token ?? "uncategorized";
  const handler = handlerMap[resolvedToken] ?? handleUncategorized;

  await log(thingyId, `[Routing] token=${resolvedToken}`, "started");

  try {
    await handler(content, thingyId);
    await log(thingyId, `[Routing] token=${resolvedToken}`, "completed");
  } catch (error) {
    await log(
      thingyId,
      `[Routing] token=${resolvedToken} error=${error instanceof Error ? error.message : String(error)}`,
      "failed"
    );
  }
}
