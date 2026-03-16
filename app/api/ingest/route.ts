import { NextRequest, NextResponse } from "next/server";
import { db } from "@vercel/postgres";
import { parseInput } from "@/lib/parser";
import { route } from "@/lib/router";

export async function POST(request: NextRequest) {
  let body: { text?: string; clientId?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { text, clientId: providedClientId } = body;

  if (!text || typeof text !== "string") {
    return NextResponse.json(
      { success: false, error: "Missing or invalid 'text' field" },
      { status: 400 }
    );
  }

  const clientId = providedClientId && typeof providedClientId === "string"
    ? providedClientId
    : crypto.randomUUID();

  const client = await db.connect();

  try {
    // Idempotency check
    const existing = await client.sql`
      SELECT id, token FROM thingies WHERE client_id = ${clientId}
    `;

    if (existing.rows.length > 0) {
      return NextResponse.json({
        success: true,
        thingyId: existing.rows[0].id,
        token: existing.rows[0].token,
        deduplicated: true,
      });
    }

    const { content, token, contextToken } = parseInput(text);

    // Atomic write: insert thingy + first log entry in a single transaction
    await client.sql`BEGIN`;

    const insertResult = await client.sql`
      INSERT INTO thingies (client_id, content, token, status)
      VALUES (${clientId}, ${content}, ${token}, 'processing')
      RETURNING id
    `;

    const thingyId = insertResult.rows[0].id as number;

    await client.sql`
      INSERT INTO execution_logs (thingy_id, action, status)
      VALUES (${thingyId}, '[Started] Ingested via API', 'started')
    `;

    await client.sql`COMMIT`;

    // Route after transaction commits so the DB state is consistent
    await route(content, token, thingyId, contextToken);

    return NextResponse.json({ success: true, thingyId, token });
  } catch (error) {
    await client.sql`ROLLBACK`.catch(() => {});
    console.error("[ingest] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
