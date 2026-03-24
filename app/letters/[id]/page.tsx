import { redirect } from "next/navigation";

import { cancelScheduledLetterAction, updateScheduledLetterAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getLetterStatusLabel } from "@/lib/ui-text";
import { formatDateTime } from "@/lib/utils";

type Params = Promise<{ id: string }>;

export default async function LetterDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: letter, error } = await supabase
    .from("letters")
    .select(
      "id, sender_user_id, recipient_user_id, family_id, body_text, status, scheduled_at, delivered_at, read_at, editable_until, created_at"
    )
    .eq("id", id)
    .single();

  if (error || !letter) {
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

    const { error: readError } = await supabase
      .from("letters")
      .update({
        status: "read",
        read_at: nowIso
      })
      .eq("id", letter.id)
      .eq("recipient_user_id", user.id)
      .eq("status", "delivered");

    if (!readError) {
      effectiveStatus = "read";
      effectiveReadAt = nowIso;
    }
  }

  let recipientName = "가족 구성원";
  if (isSender) {
    const { data: recipient } = await supabase
      .from("family_members")
      .select("display_name")
      .eq("family_id", letter.family_id)
      .eq("user_id", letter.recipient_user_id)
      .maybeSingle();

    if (recipient?.display_name) {
      recipientName = recipient.display_name;
    }
  }

  const editable = isSender && effectiveStatus === "scheduled" && new Date(letter.editable_until).getTime() > Date.now();

  return (
    <section className="card stack">
      <h1>편지 상세</h1>
      {isSender && <p className="muted">받는 사람: {recipientName}</p>}
      <span className={`badge ${effectiveStatus === "read" ? "ok" : ""}`}>{getLetterStatusLabel(effectiveStatus)}</span>
      <p className="muted">예약 시각: {formatDateTime(letter.scheduled_at)}</p>
      <p className="muted">전달 시각: {formatDateTime(letter.delivered_at)}</p>
      <p className="muted">읽은 시각: {formatDateTime(effectiveReadAt)}</p>
      <p style={{ whiteSpace: "pre-wrap" }}>{letter.body_text}</p>

      {editable && (
        <>
          <form action={updateScheduledLetterAction} className="stack">
            <input type="hidden" name="letterId" value={letter.id} />
            <label>
              편지 내용 수정
              <textarea name="bodyText" defaultValue={letter.body_text} maxLength={2000} required />
            </label>
            <button type="submit" className="secondary">
              수정 저장
            </button>
          </form>

          <form action={cancelScheduledLetterAction}>
            <input type="hidden" name="letterId" value={letter.id} />
            <button type="submit" className="danger">
              편지 취소
            </button>
          </form>
        </>
      )}
    </section>
  );
}
