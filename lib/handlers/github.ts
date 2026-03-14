import { log } from "@/lib/logger";

export async function handleGitHub(
  content: string,
  thingyId: number
): Promise<void> {
  await log(thingyId, "[GitHub] Handler started", "started");

  try {
    // TODO: Implement with @octokit/rest
    console.log("[GitHub] Would push to GitHub:", content);
  } catch (error) {
    await log(
      thingyId,
      `[GitHub] Error: ${error instanceof Error ? error.message : String(error)}`,
      "failed"
    );
    throw error;
  }

  await log(thingyId, "[GitHub] Handler completed", "completed");
}
