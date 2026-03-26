import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createAnswerCommentAction } from "@/app/actions";
import { AnalyticsPageView } from "@/app/components/analytics-page-view";
import { EmptyState } from "@/app/components/empty-state";
import { PageRefreshOnSuccess } from "@/app/components/page-refresh-on-success";
import { StatusMessage } from "@/app/components/status-message";
import { Badge } from "@/app/components/ui/badge";
import { Button, buttonVariants } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Textarea } from "@/app/components/ui/textarea";
import { buildAnswerCommentThreads } from "@/lib/answer-comments";
import { requireMembership, requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AnswerCommentRecord } from "@/lib/types";
import { getUiErrorMessage } from "@/lib/ui-text";
import { cn, formatDate, formatDateTime } from "@/lib/utils";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type AnswerDetailRow = {
  id: string;
  question_id: string;
  family_id: string;
  author_user_id: string;
  body_text: string;
  created_at: string;
};

type QuestionRow = {
  prompt_text: string;
  publish_date: string;
};

type CommentComposerProps = {
  answerId: string;
  parentCommentId?: string;
  label: string;
  placeholder: string;
  submitLabel: string;
  buttonVariant?: "default" | "secondary";
  buttonSize?: "default" | "sm";
  className?: string;
};

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];

  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] : value;
}

function CommentComposer({
  answerId,
  parentCommentId,
  label,
  placeholder,
  submitLabel,
  buttonVariant = "default",
  buttonSize = "default",
  className
}: CommentComposerProps) {
  return (
    <form action={createAnswerCommentAction} className={cn("section-stack", className)}>
      <input type="hidden" name="answerId" value={answerId} />
      {parentCommentId ? <input type="hidden" name="parentCommentId" value={parentCommentId} /> : null}
      <label className="field">
        <span>{label}</span>
        <Textarea name="bodyText" maxLength={800} required placeholder={placeholder} />
      </label>
      <div className="flex justify-end">
        <Button type="submit" variant={buttonVariant} size={buttonSize}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default async function AnswerDetailPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser();
  const membership = await requireMembership(user.id);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("answers")
    .select("id, question_id, family_id, author_user_id, body_text, created_at")
    .eq("id", id)
    .maybeSingle();

  const answer = data as AnswerDetailRow | null;

  if (error || !answer || answer.family_id !== membership.family_id) {
    redirect("/prompts");
  }

  const [{ data: questionData, error: questionError }, { data: commentsData, error: commentsError }, { data: members, error: membersError }] =
    await Promise.all([
      supabase.from("questions").select("prompt_text, publish_date").eq("id", answer.question_id).maybeSingle(),
      supabase
        .from("answer_comments")
        .select("id, answer_id, family_id, author_user_id, parent_comment_id, body_text, created_at")
        .eq("answer_id", id)
        .order("created_at", { ascending: true }),
      supabase.from("family_members").select("user_id, display_name").eq("family_id", membership.family_id)
    ]);

  const question = questionData as QuestionRow | null;
  const comments = (commentsData ?? []) as AnswerCommentRecord[];

  if (questionError || !question) {
    redirect("/prompts");
  }

  if (commentsError) {
    throw new Error(commentsError.message);
  }

  if (membersError) {
    throw new Error(membersError.message);
  }

  const commentThreads = buildAnswerCommentThreads(comments);
  const displayNameByUserId = new Map((members ?? []).map((member) => [member.user_id, member.display_name]));
  const commented = readParam(query, "commented");
  const errorParam = readParam(query, "error");
  const errorMessage = errorParam ? getUiErrorMessage(errorParam) : "";

  return (
    <section className="page-stack">
      <AnalyticsPageView
        eventName="answerDetailViewed"
        eventProperties={{
          answerId: id,
          questionId: answer.question_id
        }}
      />
      <PageRefreshOnSuccess watchedParams={["commented"]} />

      <Link href={`/prompts/${answer.question_id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit no-underline")}>
        <ArrowLeft className="h-4 w-4" />
        질문으로 돌아가기
      </Link>

      <Card className="overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,245,255,0.94))]">
        <CardContent className="space-y-4 px-6 py-6">
          <Badge variant="accent">{formatDate(question.publish_date)}</Badge>
          <h1 className="font-serif text-[1.9rem] leading-tight text-slate-950">{question.prompt_text}</h1>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 px-6 py-6">
          <div className="flex items-start justify-between gap-3">
            <strong className="text-sm text-slate-950">{displayNameByUserId.get(answer.author_user_id) ?? "이름 없음"}</strong>
            <span className="text-sm text-slate-400">{formatDateTime(answer.created_at)}</span>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{answer.body_text}</p>
        </CardContent>
      </Card>

      <div id="comments" className="section-stack scroll-mt-24">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-950">댓글</h2>
          <p className="text-sm text-slate-400">{comments.length}개</p>
        </div>

        {commented === "1" ? <StatusMessage variant="success">댓글이 등록됐어요.</StatusMessage> : null}
        {errorMessage ? <StatusMessage variant="error">{errorMessage}</StatusMessage> : null}

        {commentThreads.length > 0 ? (
          <div className="grid gap-3">
            {commentThreads.map((comment) => (
              <Card key={comment.id} id={`comment-${comment.id}`} className="bg-white/84">
                <CardContent className="space-y-4 px-5 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <strong className="text-sm text-slate-950">{displayNameByUserId.get(comment.author_user_id) ?? "이름 없음"}</strong>
                    <span className="text-sm text-slate-400">{formatDateTime(comment.created_at)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{comment.body_text}</p>

                  {comment.replies.length > 0 ? (
                    <div className="space-y-3 rounded-[24px] border border-slate-200/70 bg-slate-50/75 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">답글</p>
                      <div className="grid gap-3">
                        {comment.replies.map((reply) => (
                          <div
                            key={reply.id}
                            id={`comment-${reply.id}`}
                            className="space-y-3 rounded-[20px] border border-slate-200/80 bg-white px-4 py-4 shadow-[0_14px_28px_-26px_rgba(15,23,42,0.45)]"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <strong className="text-sm text-slate-950">{displayNameByUserId.get(reply.author_user_id) ?? "이름 없음"}</strong>
                              <span className="text-sm text-slate-400">{formatDateTime(reply.created_at)}</span>
                            </div>
                            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{reply.body_text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-[24px] border border-slate-200/70 bg-slate-50/70 px-4 py-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-slate-950">대댓글 남기기</h3>
                      <p className="text-sm leading-6 text-slate-500">이 댓글에 이어서 답글을 남겨보세요.</p>
                    </div>
                    <CommentComposer
                      answerId={id}
                      parentCommentId={comment.id}
                      label="대댓글 내용"
                      placeholder="이 댓글에 답하는 마음을 남겨보세요."
                      submitLabel="대댓글 남기기"
                      buttonVariant="secondary"
                      buttonSize="sm"
                      className="mt-4"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="아직 댓글이 없어요" description="가볍게 한마디를 남기며 대화를 이어가 보세요." />
        )}

        <Card>
          <CardContent className="space-y-5 px-6 py-6">
            <div className="space-y-1.5">
              <h3 className="text-lg font-semibold text-slate-950">댓글 남기기</h3>
              <p className="text-sm leading-6 text-slate-500">짧은 한마디만으로도 대화가 이어질 수 있어요.</p>
            </div>
            <CommentComposer
              answerId={id}
              label="댓글 내용"
              placeholder="마음을 담아 짧게 남겨보세요."
              submitLabel="댓글 남기기"
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
