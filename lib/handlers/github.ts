import { Octokit } from "@octokit/rest";
import Fuse from "fuse.js";
import { log } from "@/lib/logger";

const REPO_OWNER = "knectardev";
const DEFAULT_REPO = "lot";
const FUSE_SCORE_THRESHOLD = 0.4;
const CACHE_TTL_MS = 5 * 60 * 1000;

let repoCache: { repos: string[]; fetchedAt: number } | null = null;

async function fetchRepoNames(octokit: Octokit): Promise<string[]> {
  if (repoCache && Date.now() - repoCache.fetchedAt < CACHE_TTL_MS) {
    return repoCache.repos;
  }

  const { data } = await octokit.repos.listForAuthenticatedUser({
    per_page: 100,
    sort: "updated",
  });

  const repos = data.map((r) => r.name);
  repoCache = { repos, fetchedAt: Date.now() };
  return repos;
}

async function findBestRepo(
  octokit: Octokit,
  searchQuery: string,
  thingyId: number
): Promise<string | null> {
  const repos = await fetchRepoNames(octokit);

  const fuse = new Fuse(repos, {
    threshold: FUSE_SCORE_THRESHOLD,
    includeScore: true,
  });

  const results = fuse.search(searchQuery);

  if (results.length === 0) {
    await log(
      thingyId,
      `[GitHub] No matching repo for "${searchQuery}" (searched ${repos.length} repos)`,
      "started"
    );
    return null;
  }

  const best = results[0];
  const score = best.score ?? 1;

  await log(
    thingyId,
    `[GitHub] Fuzzy match: "${searchQuery}" -> "${best.item}" (score: ${score.toFixed(3)}, ${repos.length} repos searched)`,
    "started"
  );

  return best.item;
}

export async function handleGitHub(
  content: string,
  thingyId: number,
  contextToken?: string | null
): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    await log(thingyId, "[GitHub] Missing GITHUB_TOKEN env var", "failed");
    return;
  }

  const octokit = new Octokit({ auth: token });

  let targetRepo = DEFAULT_REPO;

  if (contextToken) {
    const matched = await findBestRepo(octokit, contextToken, thingyId);
    if (matched) {
      targetRepo = matched;
    } else {
      await log(
        thingyId,
        `[GitHub] No matching repo for "${contextToken}" -- falling back to ${DEFAULT_REPO}`,
        "started"
      );
    }
  }

  await log(thingyId, `[GitHub] Creating issue in ${REPO_OWNER}/${targetRepo}`, "started");

  try {
    const { data } = await octokit.issues.create({
      owner: REPO_OWNER,
      repo: targetRepo,
      title: content,
      body: `Created via Thingy capture (thingy_id: ${thingyId})`,
    });

    await log(
      thingyId,
      `[GitHub] Issue #${data.number} created in ${REPO_OWNER}/${targetRepo}`,
      "completed"
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = String(error).includes("403") || String(error).includes("401")
      ? `[GitHub] Auth failed -- check GITHUB_TOKEN has Issues write permission on ${REPO_OWNER}/${targetRepo}`
      : `[GitHub] Error: ${message}`;

    await log(thingyId, status, "failed");
  }
}
