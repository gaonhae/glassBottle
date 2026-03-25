import { NextResponse } from "next/server";
import { z } from "zod";

import { analyticsEventNames, safeTrackAdminAnalyticsEvent, safeTrackServerAnalyticsEvent } from "@/lib/analytics";
import { getMembership } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const analyticsRequestSchema = z.object({
  eventName: z.enum(analyticsEventNames),
  properties: z.record(z.string(), z.unknown()).optional()
});

export async function POST(request: Request) {
  const payload = analyticsRequestSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid analytics payload." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    await safeTrackAdminAnalyticsEvent({
      eventName: payload.data.eventName,
      properties: payload.data.properties
    });

    return NextResponse.json({ ok: true });
  }

  const membership = await getMembership(user.id);

  await safeTrackServerAnalyticsEvent({
    eventName: payload.data.eventName,
    userId: user.id,
    familyId: membership?.family_id ?? null,
    properties: payload.data.properties
  });

  return NextResponse.json({ ok: true });
}
