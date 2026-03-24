import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";
import { getQuestionPublishDate, getQuestionTemplateIndex } from "@/lib/questions";

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

async function runPublisher(request: NextRequest) {
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

  const publishDate = getQuestionPublishDate();

  const { data: existingQuestion, error: existingError } = await admin
    .from("questions")
    .select("id, publish_date")
    .eq("publish_date", publishDate)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (existingQuestion) {
    return NextResponse.json({ created: false, questionId: existingQuestion.id, publishDate });
  }

  const { data: templates, error: templatesError } = await admin
    .from("question_templates")
    .select("id, body_text, sort_order")
    .order("sort_order", { ascending: true });

  if (templatesError) {
    return NextResponse.json({ error: templatesError.message }, { status: 500 });
  }

  if (!templates || templates.length === 0) {
    return NextResponse.json({ error: "No question templates available." }, { status: 500 });
  }

  const templateIndex = getQuestionTemplateIndex(publishDate, templates.length);
  const template = templates[templateIndex];

  const { data: createdQuestion, error: insertError } = await admin
    .from("questions")
    .insert({
      template_id: template.id,
      prompt_text: template.body_text,
      publish_date: publishDate
    })
    .select("id, publish_date")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    created: true,
    questionId: createdQuestion.id,
    publishDate: createdQuestion.publish_date
  });
}

export async function GET(request: NextRequest) {
  return runPublisher(request);
}

export async function POST(request: NextRequest) {
  return runPublisher(request);
}
