import { Octokit } from "@octokit/rest";
import { log } from "@/lib/logger";

const REPO_OWNER = "knectardev";
const REPO_NAME = "lot";

export async function handleGitHub(
  content: string,
  thingyId: number
): Promise<void> {
  await log(thingyId, "[GitHub] Creating issue in knectardev/lot", "started");

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    await log(thingyId, "[GitHub] Missing GITHUB_TOKEN env var", "failed");
    return;
  }

  try {
    const octokit = new Octokit({ auth: token });

    const { data } = await octokit.issues.create({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title: content,
      body: `Created via Thingy capture (thingy_id: ${thingyId})`,
    });

    await log(
      thingyId,
      `[GitHub] Issue #${data.number} created`,
      "completed"
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = String(error).includes("403") || String(error).includes("401")
      ? "[GitHub] Auth failed -- check GITHUB_TOKEN has Issues write permission on knectardev/lot"
      : `[GitHub] Error: ${message}`;

    await log(thingyId, status, "failed");
  }
}
