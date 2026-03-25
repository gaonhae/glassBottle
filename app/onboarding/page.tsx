import { redirect } from "next/navigation";

import { createFamilyAction, joinFamilyAction } from "@/app/actions";
import { PageHeader } from "@/app/components/page-header";
import { StatusMessage } from "@/app/components/status-message";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { getMembership, requireUser } from "@/lib/auth";
import { normalizeInviteCode } from "@/lib/invite";
import { getUiErrorMessage, getUiNoticeMessage } from "@/lib/ui-text";

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
    redirect("/prompts");
  }

  const params = await searchParams;
  const error = readParam(params, "error");
  const notice = readParam(params, "notice");
  const mode = readParam(params, "mode") === "join" ? "join" : "create";
  const inviteCode = readParam(params, "inviteCode");
  const prefilledInviteCode = inviteCode ? normalizeInviteCode(inviteCode) : "";
  const errorMessage = error ? getUiErrorMessage(error) : "";
  const noticeMessage = notice ? getUiNoticeMessage(notice) : "";
  const showJoinFirst = mode === "join";

  const createCard = (
    <Card key="create">
      <CardHeader>
        <CardTitle>? ?? ?? ???</CardTitle>
        <CardDescription>?? ??? ???, ?? ??? ???? ?????.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={createFamilyAction} className="section-stack">
          <label className="field">
            <span>? ?? ??</span>
            <Input name="displayName" maxLength={24} required placeholder="?: ??, ??" />
          </label>
          <label className="field">
            <span>?? ??</span>
            <Input name="familyName" maxLength={40} required placeholder="?: ?? ??" />
          </label>
          <Button type="submit">?? ?? ???</Button>
        </form>
      </CardContent>
    </Card>
  );

  const joinCard = (
    <Card key="join">
      <CardHeader>
        <CardTitle>?? ??? ????</CardTitle>
        <CardDescription>???? ?? ?? ??? ???? ?? ??? ? ????.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={joinFamilyAction} className="section-stack">
          <label className="field">
            <span>? ?? ??</span>
            <Input name="displayName" maxLength={24} required placeholder="?: ??, ??" />
          </label>
          <label className="field">
            <span>?? ??</span>
            <Input name="inviteCode" required defaultValue={prefilledInviteCode} placeholder="ABCD2345" className="uppercase tracking-[0.22em]" />
          </label>
          <Button type="submit" variant="secondary">
            ?? ?? ????
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Onboarding"
        title="?? ??? ??? ????"
        description="??? ?? ??? ????, ?? ??? ??? ?? ??? ??? ? ????."
      />

      {noticeMessage ? <StatusMessage variant="success">{noticeMessage}</StatusMessage> : null}
      {errorMessage ? <StatusMessage variant="error">{errorMessage}</StatusMessage> : null}

      <div className="grid gap-4">{showJoinFirst ? [joinCard, createCard] : [createCard, joinCard]}</div>
    </section>
  );
}
