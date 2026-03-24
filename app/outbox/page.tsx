import Link from "next/link";
import { redirect } from "next/navigation";

import { cancelScheduledLetterAction, updateScheduledLetterAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getLetterStatusLabel, getUiErrorMessage } from "@/lib/ui-text";
import { formatDateTime, snippet } from "@/lib/utils";

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
  const supabase = await createSupabaseServerClient();

  const { data: membership } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

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
    <section className="stack">
      <div className="actions" style={{ justifyContent: "space-between" }}>
        <h1>보낸 편지함</h1>
        <Link href="/letters/new">
          <button type="button">새 편지 쓰기</button>
        </Link>
      </div>

      {sent === "1" && <p className="success">편지 예약이 완료되었습니다.</p>}
      {updated === "1" && <p className="success">예약된 편지가 수정되었습니다.</p>}
      {canceled === "1" && <p className="success">예약된 편지가 취소되었습니다.</p>}
      {errorMessage && <p className="error">{errorMessage}</p>}

      {lettersResult.data && lettersResult.data.length > 0 ? (
        <div className="list">
          {lettersResult.data.map((letter) => {
            const editable = letter.status === "scheduled" && new Date(letter.editable_until).getTime() > now;
            const recipientName = nameByUserId.get(letter.recipient_user_id) ?? "가족 구성원";

            return (
              <article key={letter.id} className="card stack">
                <div className="actions" style={{ justifyContent: "space-between" }}>
                  <span className={`badge ${letter.status === "read" ? "ok" : ""}`}>{getLetterStatusLabel(letter.status)}</span>
                  <span className="muted">받는 사람: {recipientName}</span>
                </div>
                <p>{snippet(letter.body_text, 120)}</p>
                <p className="muted">예약 시각: {formatDateTime(letter.scheduled_at)}</p>
                <p className="muted">읽은 시각: {formatDateTime(letter.read_at)}</p>
                <Link href={`/letters/${letter.id}`}>상세 보기</Link>

                {editable && (
                  <div className="stack">
                    <form action={updateScheduledLetterAction} className="stack">
                      <input type="hidden" name="letterId" value={letter.id} />
                      <label>
                        5분 이내 수정
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
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <section className="card stack">
          <p className="muted">아직 보낸 편지가 없습니다.</p>
        </section>
      )}
    </section>
  );
}
