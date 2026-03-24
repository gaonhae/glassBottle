import { redirect } from "next/navigation";

import { signOutAction, updateDisplayNameAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getFamilyRoleLabel, getUiErrorMessage } from "@/lib/ui-text";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];

  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] : value;
}

export default async function SettingsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const [{ data: membership }, params] = await Promise.all([
    supabase.from("family_members").select("family_id, display_name").eq("user_id", user.id).maybeSingle(),
    searchParams
  ]);

  if (!membership) {
    redirect("/onboarding");
  }

  const { data: family } = await supabase
    .from("families")
    .select("id, invite_code, owner_user_id")
    .eq("id", membership.family_id)
    .maybeSingle();

  const error = readParam(params, "error");
  const updated = readParam(params, "updated");
  const errorMessage = error ? getUiErrorMessage(error) : "";

  const isOwner = family?.owner_user_id === user.id;

  return (
    <section className="stack">
      <h1>설정</h1>
      {updated === "1" && <p className="success">표시 이름이 변경되었습니다.</p>}
      {errorMessage && <p className="error">{errorMessage}</p>}

      <div className="card stack">
        <h2>표시 이름</h2>
        <form action={updateDisplayNameAction} className="actions">
          <input name="displayName" defaultValue={membership.display_name} maxLength={24} required />
          <button type="submit">저장</button>
        </form>
      </div>

      <div className="card stack">
        <h2>가족 정보</h2>
        {family ? (
          <>
            <p className="muted">초대 코드: {family.invite_code}</p>
            <p className="muted">역할: {getFamilyRoleLabel(isOwner)}</p>
          </>
        ) : (
          <p className="muted">가족 정보를 불러올 수 없습니다.</p>
        )}
      </div>

      <div className="card stack">
        <h2>계정</h2>
        <form action={signOutAction}>
          <button type="submit" className="secondary">
            로그아웃
          </button>
        </form>
      </div>
    </section>
  );
}
