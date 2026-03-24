import Link from "next/link";

import { cancelScheduledLetterAction, updateScheduledLetterAction } from "@/app/actions";
import { EmptyState } from "@/app/components/empty-state";
import { PageHeader } from "@/app/components/page-header";
import { StatusMessage } from "@/app/components/status-message";
import { Badge } from "@/app/components/ui/badge";
import { buttonVariants, Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Textarea } from "@/app/components/ui/textarea";
import { requireMembership, requireUser } from "@/lib/auth";
import { promoteDueLettersForUser } from "@/lib/letters-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getLetterStatusLabel, getUiErrorMessage } from "@/lib/ui-text";
import { cn, formatDateTime, snippet } from "@/lib/utils";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];

  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] : value;
}

export default async function OutboxPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const membership = await requireMembership(user.id);
  await promoteDueLettersForUser(user.id);
  const supabase = await createSupabaseServerClient();

  const [lettersResult, recipientsResult, params] = await Promise.all([
    supabase
      .from("letters")
      .select("id, recipient_user_id, body_text, status, scheduled_at, delivered_at, read_at, editable_until, created_at")
      .eq("sender_user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("family_members").select("user_id, display_name").eq("family_id", membership.family_id),
    searchParams
  ]);

  if (lettersResult.error) {
    throw new Error(lettersResult.error.message);
  }

  if (recipientsResult.error) {
    throw new Error(recipientsResult.error.message);
  }

  const nameByUserId = new Map((recipientsResult.data ?? []).map((member) => [member.user_id, member.display_name]));
  const sent = readParam(params, "sent");
  const updated = readParam(params, "updated");
  const canceled = readParam(params, "canceled");
  const error = readParam(params, "error");
  const errorMessage = error ? getUiErrorMessage(error) : "";
  const now = Date.now();

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Outbox"
        title="보낸 편지"
        description="전달을 기다리는 편지와 이미 읽힌 편지까지 한눈에 확인할 수 있습니다."
        action={
          <Link href="/letters/new" className={cn(buttonVariants({ size: "sm" }), "no-underline")}>
            새 편지 쓰기
          </Link>
        }
      />

      {sent === "1" ? <StatusMessage variant="success">편지를 보냈습니다. 이제 조용히 도착을 기다려 보세요.</StatusMessage> : null}
      {updated === "1" ? <StatusMessage variant="success">편지를 수정했습니다.</StatusMessage> : null}
      {canceled === "1" ? <StatusMessage variant="success">편지를 취소했습니다.</StatusMessage> : null}
      {errorMessage ? <StatusMessage variant="error">{errorMessage}</StatusMessage> : null}

      {lettersResult.data && lettersResult.data.length > 0 ? (
        <div className="grid gap-3">
          {lettersResult.data.map((letter) => {
            const editable = letter.status === "scheduled" && new Date(letter.editable_until).getTime() > now;
            const recipientName = nameByUserId.get(letter.recipient_user_id) ?? "이름 없음";

            return (
              <Card key={letter.id}>
                <CardContent className="space-y-5 px-5 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <Badge variant={letter.status === "read" ? "success" : letter.status === "canceled" ? "danger" : "accent"}>
                      {getLetterStatusLabel(letter.status)}
                    </Badge>
                    <p className="text-sm text-slate-400">받는 사람 {recipientName}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm leading-6 text-slate-700">{snippet(letter.body_text, 120)}</p>
                    <div className="meta-list">
                      <p>예약 시간: {formatDateTime(letter.scheduled_at)}</p>
                      <p>도착 시간: {formatDateTime(letter.delivered_at)}</p>
                      <p>읽은 시간: {formatDateTime(letter.read_at)}</p>
                    </div>
                  </div>

                  <Link href={`/letters/${letter.id}`} className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "w-fit no-underline")}>
                    상세 보기
                  </Link>

                  {editable ? (
                    <Card className="border-dashed border-slate-200 bg-slate-50/70 shadow-none">
                      <CardContent className="space-y-4 px-4 py-4">
                        <div className="space-y-1">
                          <h3 className="text-sm font-semibold text-slate-950">5분 안에는 수정 또는 취소가 가능합니다.</h3>
                          <p className="text-sm leading-6 text-slate-500">말을 조금 다듬고 싶다면 지금 수정해 주세요.</p>
                        </div>

                        <form action={updateScheduledLetterAction} className="section-stack">
                          <input type="hidden" name="letterId" value={letter.id} />
                          <label className="field">
                            <span>편지 내용 수정</span>
                            <Textarea name="bodyText" defaultValue={letter.body_text} maxLength={2000} required className="min-h-[140px]" />
                          </label>
                          <div className="flex flex-col gap-3 sm:flex-row">
                            <Button type="submit" variant="secondary" className="sm:flex-1">
                              수정 저장하기
                            </Button>
                          </div>
                        </form>

                        <form action={cancelScheduledLetterAction}>
                          <input type="hidden" name="letterId" value={letter.id} />
                          <Button type="submit" variant="destructive" className="w-full">
                            이 편지 취소하기
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="보낸 편지가 아직 없어요"
          description="첫 편지를 쓰면 전달 전 상태와 읽힘 상태를 이곳에서 관리할 수 있습니다."
          action={
            <Link href="/letters/new" className={cn(buttonVariants({ size: "sm" }), "no-underline")}>
              첫 편지 쓰기
            </Link>
          }
        />
      )}
    </section>
  );
}
