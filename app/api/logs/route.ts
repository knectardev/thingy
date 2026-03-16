import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET(request: NextRequest) {
  const includeArchived = request.nextUrl.searchParams.get("includeArchived") === "true";

  try {
    const result = includeArchived
      ? await sql`
          SELECT
            el.id,
            el.thingy_id,
            el.action,
            el.status,
            el.timestamp,
            t.content,
            t.token,
            t.archived
          FROM execution_logs el
          LEFT JOIN thingies t ON t.id = el.thingy_id
          ORDER BY el.timestamp DESC
          LIMIT 100
        `
      : await sql`
          SELECT
            el.id,
            el.thingy_id,
            el.action,
            el.status,
            el.timestamp,
            t.content,
            t.token,
            t.archived
          FROM execution_logs el
          LEFT JOIN thingies t ON t.id = el.thingy_id
          WHERE t.archived IS NOT TRUE
          ORDER BY el.timestamp DESC
          LIMIT 50
        `;

    return NextResponse.json({ success: true, logs: result.rows });
  } catch (error) {
    console.error("[logs] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
