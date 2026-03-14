import { log } from "@/lib/logger";

export async function handleUncategorized(
  content: string,
  thingyId: number
): Promise<void> {
  await log(thingyId, "[Uncategorized] Handler started", "started");

  try {
    console.log("[Uncategorized] Stored without routing:", content);
  } catch (error) {
    await log(
      thingyId,
      `[Uncategorized] Error: ${error instanceof Error ? error.message : String(error)}`,
      "failed"
    );
    throw error;
  }

  await log(thingyId, "[Uncategorized] Handler completed", "completed");
}
