import { NextResponse } from "next/server";

import { toSeoulIsoOffsetString } from "@/lib/time";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "glassbottle",
    timestamp: toSeoulIsoOffsetString(new Date())
  });
}
