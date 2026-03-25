import { redirect } from "next/navigation";

import { cancelScheduledLetterAction, updateScheduledLetterAction } from "@/app/actions";
import { PageHeader } from "@/app/components/page-header";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Textarea } from "@/app/components/ui/textarea";
import { safeTrackServerAnalyticsEvent } from "@/lib/analytics";
import { requireMembership, requireUser } from "@/lib/auth";
import { promoteDueLettersForUser } from "@/lib/letters-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getLetterStatusLabel } from "@/lib/ui-text";
import { formatDateTime } from "@/lib/utils";

type Params = Promise<{ id: string }>;

export default async function LetterDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const user = await requireUser();
  const membership = await requireMembership(user.id);
  await promoteDueLettersForUser(user.id);
  const supabase = await createSupabaseServerClient();

  const { data: letter, error } = await supabase
    .from("letters")
    .select(
      "id, sender_user_id, recipient_user_id, family_id, body_text, status, scheduled_at, delivered_at, read_at, editable_until, created_at"
    )
    .eq("id", id)
    .single();

  if (error || !letter || letter.family_id !== membership.family_id) {
    redirect("/inbox");
  }

  const isSender = letter.sender_user_id === user.id;
  const isRecipient = letter.recipient_user_id === user.id;

  if (!isSender && !isRecipient) {
    redirect("/inbox");
  }

  if (isRecipient && letter.status === "scheduled") {
    redirect("/inbox");
  }

  let effectiveStatus = letter.status;
  let effectiveReadAt = letter.read_at;

  if (isRecipient && letter.status === "delivered") {
    const nowIso = new Date().toISOString();

    const { data: readLetter, error: readError } = await supabase
      .from("letters")
      .update({
        status: "read",
        read_at: nowIso
      })
      .eq("id", letter.id)
      .eq("recipient_user_id", user.id)
      .eq("status", "delivered")
      .select("id")
      .maybeSingle();

    if (!readError && readLetter) {
      effectiveStatus = "read";
      effectiveReadAt = nowIso;

      await safeTrackServerAnalyticsEvent({
        eventName: "bottleLetterRead",
        userId: user.id,
        familyId: letter.family_id,
        properties: {
          letterId: letter.id
        }
      });
    }
  }

  const counterpartUserId = isSender ? letter.recipient_user_id : letter.sender_user_id;
  const { data: counterpart } = await supabase
    .from("family_members")
    .select("display_name")
    .eq("family_id", letter.family_id)
    .eq("user_id", counterpartUserId)
    .maybeSingle();

  const editable = isSender && effectiveStatus === "scheduled" && new Date(letter.editable_until).getTime() > Date.now();
  const counterpartLabel = isSender ? "받는 사람" : "보낸 사람";

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Letter detail"
        title="유리병 편지"
        description="지금 이 편지가 어떤 상태인지 차분하게 확인할 수 있습니다."
      />

      <Card>
        <CardContent className="space-y-5 px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant={effectiveStatus === "read" ? "success" : effectiveStatus === "canceled" ? "danger" : "accent"}>
              {getLetterStatusLabel(effectiveStatus)}
            </Badge>
            <p className="text-sm text-slate-500">
              {counterpartLabel}: {counterpart?.display_name ?? "이름 없음"}
            </p>
          </div>

          <div className="meta-list">
            <p>도착 예정: {formatDateTime(letter.scheduled_at)}</p>
            <p>도착 시간: {formatDateTime(letter.delivered_at)}</p>
            <p>읽은 시간: {formatDateTime(effectiveReadAt)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-6 py-6">
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{letter.body_text}</p>
        </CardContent>
      </Card>

      {editable ? (
        <Card>
          <CardContent className="space-y-5 px-6 py-6">
            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold text-slate-950">편지 내용을 다듬기</h2>
              <p className="text-sm leading-6 text-slate-500">보낸 뒤 5분 안에는 내용을 고치거나 전송을 취소할 수 있습니다.</p>
            </div>

            <form action={updateScheduledLetterAction} className="section-stack">
              <input type="hidden" name="letterId" value={letter.id} />
              <label className="field">
                <span>편지 내용 수정</span>
                <Textarea name="bodyText" defaultValue={letter.body_text} maxLength={2000} required className="min-h-[180px]" />
              </label>
              <Button type="submit" variant="secondary">
                내용 저장하기
              </Button>
            </form>

            <form action={cancelScheduledLetterAction}>
              <input type="hidden" name="letterId" value={letter.id} />
              <Button type="submit" variant="destructive" className="w-full">
                이 편지 보내지 않기
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
