import { readFileSync } from "fs";
import { createHash } from "crypto";

const TAG_PATTERN = /#lendl[e]?\s+task[.!?,;:]*$/i;
const API_URL = process.env.INGEST_URL ?? "http://localhost:3000/api/ingest";
const DELAY_MS = 500;

interface ImportResult {
  content: string;
  status: "imported" | "skipped" | "failed";
  detail?: string;
}

function contentToUuid(content: string): string {
  const hash = createHash("sha256").update(content).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16),
    "a" + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join("-");
}

function extractTasks(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && TAG_PATTERN.test(line));
}

async function ingest(
  text: string,
  clientId: string
): Promise<{ success: boolean; deduplicated?: boolean; error?: string }> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, clientId }),
  });
  return res.json();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx lib/scripts/import-lendl.ts <file>");
    process.exit(1);
  }

  const raw = readFileSync(filePath, "utf-8");
  const tasks = extractTasks(raw);

  if (tasks.length === 0) {
    console.log("No lines matching #lendl task / #lendle task found.");
    return;
  }

  console.log(`Found ${tasks.length} task(s) to import.\n`);

  const results: ImportResult[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const line = tasks[i];
    const content = line.replace(TAG_PATTERN, "").trim();
    const clientId = contentToUuid(content);

    try {
      const res = await ingest(line, clientId);

      if (res.deduplicated) {
        console.log(`[${i + 1}/${tasks.length}] Skipped (duplicate): "${content}"`);
        results.push({ content, status: "skipped", detail: "duplicate" });
      } else if (res.success) {
        console.log(`[${i + 1}/${tasks.length}] Imported: "${content}"`);
        results.push({ content, status: "imported" });
      } else {
        console.log(`[${i + 1}/${tasks.length}] Failed: "${content}" — ${res.error}`);
        results.push({ content, status: "failed", detail: res.error });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`[${i + 1}/${tasks.length}] Failed: "${content}" — ${msg}`);
      results.push({ content, status: "failed", detail: msg });
    }

    if (i < tasks.length - 1) await sleep(DELAY_MS);
  }

  const imported = results.filter((r) => r.status === "imported").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const failed = results.filter((r) => r.status === "failed").length;

  console.log(`\nDone: ${imported} imported, ${skipped} skipped, ${failed} failed.`);
}

main().catch((err) => {
  console.error("Fatal:", err.message ?? err);
  process.exit(1);
});
