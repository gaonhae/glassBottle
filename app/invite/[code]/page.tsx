import { redirect } from "next/navigation";

import { getMembership } from "@/lib/auth";
import { buildAuthPath, buildInvitePath, buildOnboardingPath, normalizeInviteCode } from "@/lib/invite";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Params = Promise<{ code: string }>;

export default async function InvitePage({ params }: { params: Params }) {
  const { code } = await params;
  const inviteCode = normalizeInviteCode(code);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      buildAuthPath({
        mode: "signup",
        next: buildInvitePath(inviteCode)
      })
    );
  }

  const membership = await getMembership(user.id);

  if (membership) {
    redirect("/prompts?notice=invite-link-already-in-family");
  }

  redirect(
    buildOnboardingPath({
      mode: "join",
      inviteCode,
      notice: "invite-link-ready"
    })
  );
}
