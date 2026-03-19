import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";

function isAuthorized(request: NextRequest) {
  const bearer = request.headers.get("authorization");
  const token = request.headers.get("x-cron-secret");

  if (env.CRON_SECRET && bearer === `Bearer ${env.CRON_SECRET}`) {
    return true;
  }

  if (env.CRON_SECRET && token === env.CRON_SECRET) {
    return true;
  }

  return false;
}

async function runScheduler(request: NextRequest) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is required." }, { status: 500 });
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const now = new Date().toISOString();

  const { data: dueLetters, error: fetchError } = await admin
    .from("letters")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_at", now)
    .limit(500);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!dueLetters || dueLetters.length === 0) {
    return NextResponse.json({ processed: 0, delivered: 0 });
  }

  const ids = dueLetters.map((letter) => letter.id);

  const { data: updatedRows, error: updateError } = await admin
    .from("letters")
    .update({
      status: "delivered",
      delivered_at: now
    })
    .in("id", ids)
    .eq("status", "scheduled")
    .select("id");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    processed: ids.length,
    delivered: updatedRows?.length ?? 0
  });
}

export async function GET(request: NextRequest) {
  return runScheduler(request);
}

export async function POST(request: NextRequest) {
  return runScheduler(request);
}
