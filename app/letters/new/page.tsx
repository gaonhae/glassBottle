import { redirect } from "next/navigation";

import { sendLetterAction } from "@/app/actions";
import { TimezoneField } from "@/app/components/timezone-field";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];

  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] : value;
}

export default async function NewLetterPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: membership } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    redirect("/onboarding");
  }

  const { data: recipients, error } = await supabase
    .from("family_members")
    .select("user_id, display_name")
    .eq("family_id", membership.family_id)
    .neq("user_id", user.id)
    .order("display_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const params = await searchParams;
  const errorMessage = readParam(params, "error");

  return (
    <section className="card stack">
      <h1>Write a delayed letter</h1>
      <p className="muted">Delivery is randomly scheduled between 5 and 72 hours after submission.</p>
      {errorMessage && <p className="error">{decodeURIComponent(errorMessage)}</p>}

      {recipients && recipients.length > 0 ? (
        <form action={sendLetterAction} className="stack">
          <label>
            Recipient
            <select name="recipientId" required defaultValue="">
              <option value="" disabled>
                Select a family member
              </option>
              {recipients.map((recipient) => (
                <option key={recipient.user_id} value={recipient.user_id}>
                  {recipient.display_name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Letter text (max 2000 chars)
            <textarea name="bodyText" required maxLength={2000} placeholder="Write openly. Delivery time is delayed by design." />
          </label>

          <TimezoneField />
          <button type="submit">Schedule random delivery</button>
        </form>
      ) : (
        <p className="muted">You need at least one more family member in your family to send letters.</p>
      )}
    </section>
  );
}
