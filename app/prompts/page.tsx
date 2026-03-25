import Link from "next/link";

import { AnalyticsPageView } from "@/app/components/analytics-page-view";
import { EmptyState } from "@/app/components/empty-state";
import { PageHeader } from "@/app/components/page-header";
import { StatusMessage } from "@/app/components/status-message";
import { Badge } from "@/app/components/ui/badge";
import { buttonVariants } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { requireMembership, requireUser } from "@/lib/auth";
import { canRevealFamilyAnswers } from "@/lib/questions";
import { ensureTodayQuestion } from "@/lib/questions-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { QuestionRecord } from "@/lib/types";
import { getUiErrorMessage } from "@/lib/ui-text";
import { cn, formatDate } from "@/lib/utils";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type AnswerLookupRow = {
  id: string;
  question_id: string;
};

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];

  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] : value;
}

export default async function PromptsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const membership = await requireMembership(user.id);
  await ensureTodayQuestion();
  const supabase = await createSupabaseServerClient();

  const [{ data: questions, error: questionsError }, params] = await Promise.all([
    supabase.from("questions").select("id, prompt_text, publish_date, created_at").order("publish_date", { ascending: false }).limit(14),
    searchParams
  ]);

  if (questionsError) {
    throw new Error(questionsError.message);
  }

  const questionRows = (questions ?? []) as QuestionRecord[];
  const questionIds = questionRows.map((question) => question.id);

  let answerRows: AnswerLookupRow[] = [];
  if (questionIds.length > 0) {
    const { data, error } = await supabase
      .from("answers")
      .select("id, question_id")
      .eq("author_user_id", user.id)
      .eq("family_id", membership.family_id)
      .in("question_id", questionIds);

    if (error) {
      throw new Error(error.message);
    }

    answerRows = (data ?? []) as AnswerLookupRow[];
  }

  const joined = readParam(params, "joined");
  const error = readParam(params, "error");
  const errorMessage = error ? getUiErrorMessage(error) : "";
  const answeredQuestionIds = new Set(answerRows.map((answer) => answer.question_id));
  const todayQuestion = questionRows[0] ?? null;

  return (
    <section className="page-stack">
      <AnalyticsPageView eventName="homeViewed" />

      <PageHeader eyebrow="Daily prompts" title="오늘의 질문" description="답변을 남기고, 가족의 생각을 천천히 함께 읽어 보세요." />

      {joined === "1" ? <StatusMessage variant="success">가족 참여가 완료되었습니다. 오늘의 질문을 확인해 보세요.</StatusMessage> : null}
      {errorMessage ? <StatusMessage variant="error">{errorMessage}</StatusMessage> : null}

      {todayQuestion ? (
        <Card className="overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,245,255,0.94))]">
          <CardContent className="space-y-5 px-6 py-6">
            <div className="space-y-3">
              <Badge variant="accent">{formatDate(todayQuestion.publish_date)}</Badge>
              <div className="space-y-3">
                <h2 className="font-serif text-[1.9rem] leading-tight text-slate-950">{todayQuestion.prompt_text}</h2>
                <p className="text-sm leading-6 text-slate-500">
                  {canRevealFamilyAnswers(answeredQuestionIds.has(todayQuestion.id))
                    ? "답변을 남겼다면, 이제 가족의 답변도 함께 볼 수 있어요."
                    : "먼저 내 답변을 남기면 가족의 답변이 열립니다."}
                </p>
              </div>
            </div>
            <Link href={`/prompts/${todayQuestion.id}`} className={cn(buttonVariants({ size: "lg" }), "w-full no-underline")}>
              {answeredQuestionIds.has(todayQuestion.id) ? "답변 보러 가기" : "답변 먼저 남기기"}
            </Link>
          </CardContent>
        </Card>
      ) : (
        <EmptyState title="아직 도착한 질문이 없어요" description="질문이 준비되면 여기에서 바로 확인할 수 있습니다." />
      )}

      <div className="section-stack">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-950">지난 질문</h2>
          <p className="text-sm text-slate-400">최근 14개</p>
        </div>

        {questionRows.length > 0 ? (
          <div className="grid gap-3">
            {questionRows.map((question) => {
              const answered = answeredQuestionIds.has(question.id);

              return (
                <Link key={question.id} href={`/prompts/${question.id}`} className="block no-underline">
                  <Card className="transition-transform duration-200 hover:-translate-y-0.5 hover:border-slate-200">
                    <CardContent className="space-y-4 px-5 py-5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-950">{formatDate(question.publish_date)}</p>
                        <Badge variant={answered ? "success" : "muted"}>{answered ? "답변 완료" : "답변 전"}</Badge>
                      </div>
                      <p className="text-sm leading-6 text-slate-600">{question.prompt_text}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState title="아직 지난 질문이 없어요" description="질문이 쌓이면 이곳에서 다시 볼 수 있습니다." />
        )}
      </div>
    </section>
  );
}
