import { redirect } from "next/navigation";

import { signOutAction, updateDisplayNameAction } from "@/app/actions";
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

  const isOwner = family?.owner_user_id === user.id;

  return (
    <section className="stack">
      <h1>Settings</h1>
      {updated === "1" && <p className="success">Display name updated.</p>}
      {error && <p className="error">{decodeURIComponent(error)}</p>}

      <div className="card stack">
        <h2>Display name</h2>
        <form action={updateDisplayNameAction} className="actions">
          <input name="displayName" defaultValue={membership.display_name} maxLength={24} required />
          <button type="submit">Save</button>
        </form>
      </div>

      <div className="card stack">
        <h2>Family info</h2>
        {family ? (
          <>
            <p className="muted">Invite code: {family.invite_code}</p>
            <p className="muted">Role: {isOwner ? "Owner" : "Member"}</p>
          </>
        ) : (
          <p className="muted">Family information is not available.</p>
        )}
      </div>

      <div className="card stack">
        <h2>Account</h2>
        <form action={signOutAction}>
          <button type="submit" className="secondary">
            Sign out
          </button>
        </form>
      </div>
    </section>
  );
}
