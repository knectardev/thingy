import { sql } from "@vercel/postgres";

const QUERY_TIMEOUT_MS = 5000;

export async function log(
  thingyId: number,
  action: string,
  status: string
): Promise<void> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS);

    try {
      await sql`
        INSERT INTO execution_logs (thingy_id, action, status)
        VALUES (${thingyId}, ${action}, ${status})
      `;
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error("[logger] Failed to write log entry:", error);
  }
}
