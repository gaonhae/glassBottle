import { redirect } from "next/navigation";

import { sendLetterAction } from "@/app/actions";
import { TimezoneField } from "@/app/components/timezone-field";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUiErrorMessage } from "@/lib/ui-text";

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
  const localizedErrorMessage = errorMessage ? getUiErrorMessage(errorMessage) : "";

  return (
    <section className="card stack">
      <h1>지연 편지 쓰기</h1>
      <p className="muted">제출 후 5시간에서 72시간 사이의 임의 시점에 전달되도록 예약됩니다.</p>
      {localizedErrorMessage && <p className="error">{localizedErrorMessage}</p>}

      {recipients && recipients.length > 0 ? (
        <form action={sendLetterAction} className="stack">
          <label>
            받는 사람
            <select name="recipientId" required defaultValue="">
              <option value="" disabled>
                가족 구성원을 선택하세요
              </option>
              {recipients.map((recipient) => (
                <option key={recipient.user_id} value={recipient.user_id}>
                  {recipient.display_name}
                </option>
              ))}
            </select>
          </label>

          <label>
            편지 내용 (최대 2000자)
            <textarea
              name="bodyText"
              required
              maxLength={2000}
              placeholder="솔직한 마음을 적어 보세요. 전달 시간은 의도적으로 늦춰집니다."
            />
          </label>

          <TimezoneField />
          <button type="submit">무작위 전달 예약하기</button>
        </form>
      ) : (
        <p className="muted">편지를 보내려면 가족 구성원이 한 명 이상 더 필요합니다.</p>
      )}
    </section>
  );
}
