import Link from "next/link";
import { redirect } from "next/navigation";

import { signOutAction, updateDisplayNameAction } from "@/app/actions";
import { PageHeader } from "@/app/components/page-header";
import { StatusMessage } from "@/app/components/status-message";
import { Button, buttonVariants } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { requireMembership, requireUser } from "@/lib/auth";
import { buildInviteUrl } from "@/lib/invite";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getFamilyRoleLabel, getUiErrorMessage } from "@/lib/ui-text";
import { cn } from "@/lib/utils";

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
  const membership = await requireMembership(user.id);
  const supabase = await createSupabaseServerClient();

  const [{ data: family }, params] = await Promise.all([
    supabase.from("families").select("id, invite_code, owner_user_id").eq("id", membership.family_id).maybeSingle(),
    searchParams
  ]);

  if (!family) {
    redirect("/onboarding");
  }

  const error = readParam(params, "error");
  const updated = readParam(params, "updated");
  const errorMessage = error ? getUiErrorMessage(error) : "";
  const isOwner = family.owner_user_id === user.id;
  const inviteUrl = buildInviteUrl(family.invite_code);

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Settings"
        title="??"
        description="??? ??? ?? ?? ??? ??? ? ????."
      />

      {updated === "1" ? <StatusMessage variant="success">?? ??? ???????.</StatusMessage> : null}
      {errorMessage ? <StatusMessage variant="error">{errorMessage}</StatusMessage> : null}

      <Card>
        <CardHeader>
          <CardTitle>? ???</CardTitle>
          <CardDescription>?? ?? ??? ??? ?? ?????.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateDisplayNameAction} className="section-stack">
            <label className="field">
              <span>?? ??</span>
              <Input name="displayName" defaultValue={membership.display_name} maxLength={24} required />
            </label>
            <Button type="submit">?? ????</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>?? ?? ??</CardTitle>
          <CardDescription>??? ??? ??? ?? ??? ?????.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-slate-600">
          <label className="field">
            <span>?? ??</span>
            <Input value={inviteUrl} readOnly />
          </label>
          <div className="flex flex-wrap gap-3">
            <Link href={inviteUrl} className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "no-underline")}>
              ?? ?? ????
            </Link>
          </div>
          <p>?? ??: <span className="font-semibold tracking-[0.22em] text-slate-950">{family.invite_code}</span></p>
          <p>? ??: <span className="font-semibold text-slate-950">{getFamilyRoleLabel(isOwner)}</span></p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>??</CardTitle>
          <CardDescription>?? ???? ???????.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signOutAction}>
            <Button type="submit" variant="secondary" className="w-full">
              ????
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
