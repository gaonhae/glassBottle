import Link from "next/link";
import { redirect } from "next/navigation";

import { cancelScheduledLetterAction, updateScheduledLetterAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
  const now = Date.now();

  return (
    <section className="stack">
      <div className="actions" style={{ justifyContent: "space-between" }}>
        <h1>Outbox</h1>
        <Link href="/letters/new">
          <button type="button">Write another letter</button>
        </Link>
      </div>

      {sent === "1" && <p className="success">Letter scheduled successfully.</p>}
      {updated === "1" && <p className="success">Scheduled letter updated.</p>}
      {canceled === "1" && <p className="success">Scheduled letter canceled.</p>}
      {error && <p className="error">{decodeURIComponent(error)}</p>}

      {lettersResult.data && lettersResult.data.length > 0 ? (
        <div className="list">
          {lettersResult.data.map((letter) => {
            const editable = letter.status === "scheduled" && new Date(letter.editable_until).getTime() > now;
            const recipientName = nameByUserId.get(letter.recipient_user_id) ?? "Family member";

            return (
              <article key={letter.id} className="card stack">
                <div className="actions" style={{ justifyContent: "space-between" }}>
                  <span className={`badge ${letter.status === "read" ? "ok" : ""}`}>{letter.status}</span>
                  <span className="muted">To: {recipientName}</span>
                </div>
                <p>{snippet(letter.body_text, 120)}</p>
                <p className="muted">Scheduled: {formatDateTime(letter.scheduled_at)}</p>
                <p className="muted">Read: {formatDateTime(letter.read_at)}</p>
                <Link href={`/letters/${letter.id}`}>Open details</Link>

                {editable && (
                  <div className="stack">
                    <form action={updateScheduledLetterAction} className="stack">
                      <input type="hidden" name="letterId" value={letter.id} />
                      <label>
                        Edit within 5 minutes
                        <textarea name="bodyText" defaultValue={letter.body_text} maxLength={2000} required />
                      </label>
                      <button type="submit" className="secondary">
                        Save edits
                      </button>
                    </form>

                    <form action={cancelScheduledLetterAction}>
                      <input type="hidden" name="letterId" value={letter.id} />
                      <button type="submit" className="danger">
                        Cancel letter
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
          <p className="muted">You have not sent any letters yet.</p>
        </section>
      )}
    </section>
  );
}
