import { redirect } from "next/navigation";

import { createFamilyAction, joinFamilyAction } from "@/app/actions";
import { getMembership, requireUser } from "@/lib/auth";
import { getUiErrorMessage } from "@/lib/ui-text";

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
  const errorMessage = error ? getUiErrorMessage(error) : "";

  return (
    <section className="stack">
      <h1>가족 공간 시작하기</h1>
      {errorMessage && <p className="error">{errorMessage}</p>}
      <div className="grid two">
        <div className="card stack">
          <h2>가족 만들기</h2>
          <form action={createFamilyAction} className="stack">
            <label>
              표시 이름
              <input name="displayName" maxLength={24} required placeholder="아빠, 미나, 수연 이모..." />
            </label>
            <label>
              가족 이름
              <input name="familyName" maxLength={40} required placeholder="김 가족" />
            </label>
            <button type="submit">가족 만들기</button>
          </form>
        </div>

        <div className="card stack">
          <h2>초대 코드로 참여하기</h2>
          <form action={joinFamilyAction} className="stack">
            <label>
              표시 이름
              <input name="displayName" maxLength={24} required placeholder="아빠, 미나, 수연 이모..." />
            </label>
            <label>
              초대 코드
              <input name="inviteCode" required placeholder="ABCD2345" style={{ textTransform: "uppercase" }} />
            </label>
            <button type="submit">가족 참여하기</button>
          </form>
        </div>
      </div>
    </section>
  );
}
