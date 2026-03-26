import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";

import { submitAnswerAction } from "@/app/actions";
import { AnalyticsLink } from "@/app/components/analytics-link";
import { AnalyticsPageView } from "@/app/components/analytics-page-view";
import { EmptyState } from "@/app/components/empty-state";
import { PageHeader } from "@/app/components/page-header";
import { PageRefreshOnSuccess } from "@/app/components/page-refresh-on-success";
import { StatusMessage } from "@/app/components/status-message";
import { Badge } from "@/app/components/ui/badge";
import { Button, buttonVariants } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Textarea } from "@/app/components/ui/textarea";
import { countAnswerCommentsByAnswerId } from "@/lib/answer-comments";
import { requireMembership, requireUser } from "@/lib/auth";
import { canRevealFamilyAnswers } from "@/lib/questions";
import { ensureTodayQuestion } from "@/lib/questions-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUiErrorMessage } from "@/lib/ui-text";
import { cn, formatDate, formatDateTime, snippet } from "@/lib/utils";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type QuestionPageRow = {
  id: string;
  prompt_text: string;
  publish_date: string;
};

type AnswerListRow = {
  id: string;
  author_user_id: string;
  body_text: string;
  created_at: string;
  commentCount: number;
};

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];

  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] : value;
}

export default async function PromptDetailPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser();
  const membership = await requireMembership(user.id);
  await ensureTodayQuestion();
  const supabase = await createSupabaseServerClient();

  const { data: question, error: questionError } = await supabase
    .from("questions")
    .select("id, prompt_text, publish_date")
    .eq("id", id)
    .maybeSingle();

  if (questionError || !question) {
    redirect("/prompts");
  }

  const { data: ownAnswer, error: ownAnswerError } = await supabase
    .from("answers")
    .select("id, body_text, created_at")
    .eq("question_id", id)
    .eq("author_user_id", user.id)
    .eq("family_id", membership.family_id)
    .maybeSingle();

  if (ownAnswerError) {
    throw new Error(ownAnswerError.message);
  }

  const canReveal = canRevealFamilyAnswers(Boolean(ownAnswer));
  const answered = readParam(query, "answered");
  const error = readParam(query, "error");
  const errorMessage = error ? getUiErrorMessage(error) : "";

  let answerRows: AnswerListRow[] = [];
  let displayNameByUserId = new Map<string, string>();

  if (canReveal) {
    const [{ data: answers, error: answersError }, { data: members, error: membersError }] = await Promise.all([
      supabase
        .from("answers")
        .select("id, author_user_id, body_text, created_at")
        .eq("question_id", id)
        .eq("family_id", membership.family_id)
        .order("created_at", { ascending: false }),
      supabase.from("family_members").select("user_id, display_name").eq("family_id", membership.family_id)
    ]);

    if (answersError) {
      throw new Error(answersError.message);
    }

    if (membersError) {
      throw new Error(membersError.message);
    }

    const rawAnswerRows = (answers ?? []) as Array<Omit<AnswerListRow, "commentCount">>;
    const answerIds = rawAnswerRows.map((answer) => answer.id);
    let answerCommentCountByAnswerId = new Map<string, number>();

    if (answerIds.length > 0) {
      const { data: answerComments, error: answerCommentsError } = await supabase
        .from("answer_comments")
        .select("answer_id")
        .in("answer_id", answerIds);

      if (answerCommentsError) {
        throw new Error(answerCommentsError.message);
      }

      answerCommentCountByAnswerId = countAnswerCommentsByAnswerId(
        (answerComments ?? []) as Array<{ answer_id: string }>
      );
    }

    answerRows = rawAnswerRows.map((answer) => ({
      ...answer,
      commentCount: answerCommentCountByAnswerId.get(answer.id) ?? 0
    }));
    displayNameByUserId = new Map((members ?? []).map((member) => [member.user_id, member.display_name]));
  }

  return (
    <section className="page-stack">
      <AnalyticsPageView eventName="questionViewed" eventProperties={{ questionId: id }} />
      <PageRefreshOnSuccess watchedParams={["answered"]} />

      <Link href="/prompts" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit no-underline")}>
        <ArrowLeft className="h-4 w-4" />
        질문 목록으로
      </Link>

      <Card className="overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,245,255,0.94))]">
        <CardContent className="space-y-4 px-6 py-6">
          <Badge variant="accent">{formatDate((question as QuestionPageRow).publish_date)}</Badge>
          <div className="space-y-3">
            <h1 className="font-serif text-[2rem] leading-tight text-slate-950">{(question as QuestionPageRow).prompt_text}</h1>
            <p className="text-sm leading-6 text-slate-500">
              {canReveal ? "이미 답변을 남겼으니 가족의 이야기도 함께 읽을 수 있어요." : "내 답변을 먼저 남기면 가족의 답변 카드가 열립니다."}
            </p>
          </div>
        </CardContent>
      </Card>

      {answered === "1" ? <StatusMessage variant="success">답변이 저장됐어요. 이제 가족의 이야기도 같이 볼 수 있어요.</StatusMessage> : null}
      {errorMessage ? <StatusMessage variant="error">{errorMessage}</StatusMessage> : null}

      {!canReveal ? (
        <Card>
          <CardContent className="space-y-5 px-6 py-6">
            <PageHeader title="내 답변 남기기" description="최대 2,000자까지 자유롭게 적을 수 있어요." />
            <form action={submitAnswerAction} className="section-stack">
              <input type="hidden" name="questionId" value={id} />
              <label className="field">
                <span>답변 내용</span>
                <Textarea name="bodyText" maxLength={2000} required placeholder="지금 떠오르는 생각을 편하게 적어보세요." />
              </label>
              <Button type="submit">답변 저장하기</Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="section-stack">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">가족의 답변</h2>
            <p className="text-sm text-slate-400">{answerRows.length}개</p>
          </div>
          {answerRows.length > 0 ? (
            <div className="grid gap-3">
              {answerRows.map((answer) => (
                <AnalyticsLink
                  key={answer.id}
                  href={`/answers/${answer.id}`}
                  eventName="answerCardClicked"
                  eventProperties={{
                    questionId: id,
                    answerId: answer.id
                  }}
                  className="block no-underline"
                >
                  <Card className="transition-transform duration-200 hover:-translate-y-0.5 hover:border-slate-200">
                    <CardContent className="space-y-4 px-5 py-5">
                      <div className="flex items-start justify-between gap-3">
                        <strong className="text-sm text-slate-950">{displayNameByUserId.get(answer.author_user_id) ?? "이름 없음"}</strong>
                        <span className="text-sm text-slate-400">{formatDateTime(answer.created_at)}</span>
                      </div>
                      <p className="text-sm leading-6 text-slate-600">{snippet(answer.body_text, 120)}</p>
                      <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
                        <span>클릭해서 자세히 보기</span>
                        <span>댓글 {answer.commentCount}개</span>
                      </div>
                    </CardContent>
                  </Card>
                </AnalyticsLink>
              ))}
            </div>
          ) : (
            <EmptyState title="아직 가족 답변이 없어요" description="가족이 답변을 남기면 여기에서 카드로 확인할 수 있어요." />
          )}
        </div>
      )}
    </section>
  );
}
