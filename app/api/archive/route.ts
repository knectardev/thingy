import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function PATCH(request: NextRequest) {
  let body: { thingyId?: number; archived?: boolean };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { thingyId, archived } = body;

  if (typeof thingyId !== "number" || typeof archived !== "boolean") {
    return NextResponse.json(
      { success: false, error: "Missing or invalid 'thingyId' (number) or 'archived' (boolean)" },
      { status: 400 }
    );
  }

  try {
    await sql`
      UPDATE thingies SET archived = ${archived} WHERE id = ${thingyId}
    `;

    return NextResponse.json({ success: true, thingyId, archived });
  } catch (error) {
    console.error("[archive] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
