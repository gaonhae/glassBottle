import { redirect } from "next/navigation";

import { joinFamilyFromInviteLinkAction } from "@/app/actions";
import { PageHeader } from "@/app/components/page-header";
import { StatusMessage } from "@/app/components/status-message";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { getMembership } from "@/lib/auth";
import { getAuthPath, getInvitePath, normalizeInviteCode } from "@/lib/invite-links";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUiErrorMessage } from "@/lib/ui-text";

type Params = Promise<{ inviteCode: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type ProfileRow = {
  display_name: string;
};

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];

  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] : value;
}

export default async function InvitePage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ inviteCode }, query] = await Promise.all([params, searchParams]);
  const normalizedInviteCode = normalizeInviteCode(decodeURIComponent(inviteCode));
  const invitePath = getInvitePath(normalizedInviteCode);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(getAuthPath({ mode: "login", nextPath: invitePath }));
  }

  const membership = await getMembership(user.id);

  if (membership) {
    redirect("/prompts?error=invite-already-in-family");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const error = readParam(query, "error");
  const errorMessage = error ? getUiErrorMessage(error) : "";
  const profileRow = profile as ProfileRow | null;

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Invite"
        title="가족 초대를 받았어요"
        description="표시 이름만 정하면 바로 가족에 참여할 수 있습니다."
      />

      {errorMessage ? <StatusMessage variant="error">{errorMessage}</StatusMessage> : null}

      <Card>
        <CardContent className="space-y-5 px-6 py-6">
          <div className="space-y-2 text-sm leading-6 text-slate-500">
            <p>이 링크는 가족 참여용으로만 사용됩니다.</p>
            <p>참여하면 현재 계정은 하나의 가족에만 속할 수 있습니다.</p>
          </div>

          <form action={joinFamilyFromInviteLinkAction} className="section-stack">
            <input type="hidden" name="inviteCode" value={normalizedInviteCode} />
            <label className="field">
              <span>표시 이름</span>
              <Input
                name="displayName"
                defaultValue={profileRow?.display_name ?? ""}
                maxLength={24}
                required
                placeholder="예: 민지, 아빠"
              />
            </label>
            <Button type="submit" className="w-full">
              이 가족에 참여하기
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}