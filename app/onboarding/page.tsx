import { redirect } from "next/navigation";

import { createFamilyAction, joinFamilyAction } from "@/app/actions";
import { getMembership, requireUser } from "@/lib/auth";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];

  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] : value;
}

export default async function OnboardingPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const membership = await getMembership(user.id);

  if (membership) {
    redirect("/inbox");
  }

  const params = await searchParams;
  const error = readParam(params, "error");

  return (
    <section className="stack">
      <h1>Set up your family space</h1>
      {error && <p className="error">{decodeURIComponent(error)}</p>}
      <div className="grid two">
        <div className="card stack">
          <h2>Create a family</h2>
          <form action={createFamilyAction} className="stack">
            <label>
              Your display name
              <input name="displayName" maxLength={24} required placeholder="Dad, Mina, Aunt Soo..." />
            </label>
            <label>
              Family name
              <input name="familyName" maxLength={40} required placeholder="Kim Family" />
            </label>
            <button type="submit">Create family</button>
          </form>
        </div>

        <div className="card stack">
          <h2>Join with invite code</h2>
          <form action={joinFamilyAction} className="stack">
            <label>
              Your display name
              <input name="displayName" maxLength={24} required placeholder="Dad, Mina, Aunt Soo..." />
            </label>
            <label>
              Invite code
              <input name="inviteCode" required placeholder="ABCD2345" style={{ textTransform: "uppercase" }} />
            </label>
            <button type="submit">Join family</button>
          </form>
        </div>
      </div>
    </section>
  );
}
