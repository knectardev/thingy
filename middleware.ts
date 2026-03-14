import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("key");
  if (secret !== process.env.THINGY_SECRET) {
    return new NextResponse("Access Denied", { status: 403 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
