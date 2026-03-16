import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { route } from "@/lib/router";
import { log } from "@/lib/logger";

export async function POST(request: NextRequest) {
  let body: { thingyId?: number };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { thingyId } = body;

  if (typeof thingyId !== "number") {
    return NextResponse.json(
      { success: false, error: "Missing or invalid 'thingyId' (number)" },
      { status: 400 }
    );
  }

  try {
    const result = await sql`
      SELECT id, content, token FROM thingies WHERE id = ${thingyId}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Thingy not found" },
        { status: 404 }
      );
    }

    const { content, token } = result.rows[0];

    await log(thingyId, "[Resend] Manually re-triggered", "started");
    await route(content, token, thingyId);

    return NextResponse.json({ success: true, thingyId });
  } catch (error) {
    console.error("[resend] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
