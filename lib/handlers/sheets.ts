import { log } from "@/lib/logger";

export async function handleSheets(
  content: string,
  thingyId: number
): Promise<void> {
  await log(thingyId, "[Sheets] Handler started", "started");

  try {
    // TODO: Implement with google-spreadsheet
    console.log("[Sheets] Would append to Google Sheets:", content);
  } catch (error) {
    await log(
      thingyId,
      `[Sheets] Error: ${error instanceof Error ? error.message : String(error)}`,
      "failed"
    );
    throw error;
  }

  await log(thingyId, "[Sheets] Handler completed", "completed");
}
