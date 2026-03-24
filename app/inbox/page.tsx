import Link from "next/link";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getLetterStatusLabel } from "@/lib/ui-text";
import { formatDateTime, snippet } from "@/lib/utils";

export default async function InboxPage() {
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

  const { data: letters, error } = await supabase
    .from("letters")
    .select("id, body_text, status, delivered_at, read_at, created_at")
    .eq("recipient_user_id", user.id)
    .in("status", ["delivered", "read"])
    .order("delivered_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <section className="stack">
      <div className="actions" style={{ justifyContent: "space-between" }}>
        <h1>받은 편지함</h1>
        <Link href="/letters/new">
          <button type="button">편지 쓰기</button>
        </Link>
      </div>

      {letters && letters.length > 0 ? (
        <div className="list">
          {letters.map((letter) => (
            <article key={letter.id} className="card stack">
              <div className="actions" style={{ justifyContent: "space-between" }}>
                <span className={`badge ${letter.status === "read" ? "ok" : ""}`}>{getLetterStatusLabel(letter.status)}</span>
                <span className="muted">전달 시각: {formatDateTime(letter.delivered_at)}</span>
              </div>
              <p>{snippet(letter.body_text)}</p>
              <Link href={`/letters/${letter.id}`}>편지 열기</Link>
            </article>
          ))}
        </div>
      ) : (
        <section className="card stack">
          <p className="muted">아직 도착한 편지가 없습니다. 조금 뒤에 다시 확인해 주세요.</p>
        </section>
      )}
    </section>
  );
}
