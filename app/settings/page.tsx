import { redirect } from "next/navigation";

import { signOutAction, updateDisplayNameAction } from "@/app/actions";
import { PageHeader } from "@/app/components/page-header";
import { StatusMessage } from "@/app/components/status-message";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { requireMembership, requireUser } from "@/lib/auth";
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

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Settings"
        title="설정"
        description="프로필 이름과 가족 공간 정보를 관리할 수 있습니다."
      />

      {updated === "1" ? <StatusMessage variant="success">표시 이름이 변경되었습니다.</StatusMessage> : null}
      {errorMessage ? <StatusMessage variant="error">{errorMessage}</StatusMessage> : null}

      <Card>
        <CardHeader>
          <CardTitle>내 프로필</CardTitle>
          <CardDescription>가족 공간 안에서 보이는 표시 이름입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateDisplayNameAction} className="section-stack">
            <label className="field">
              <span>표시 이름</span>
              <Input name="displayName" defaultValue={membership.display_name} maxLength={24} required />
            </label>
            <Button type="submit">이름 저장하기</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>가족 공간 정보</CardTitle>
          <CardDescription>공간에 다른 가족을 초대하거나, 내 역할을 확인할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
          <p>초대 코드: <span className="font-semibold tracking-[0.22em] text-slate-950">{family.invite_code}</span></p>
          <p>내 역할: <span className="font-semibold text-slate-950">{getFamilyRoleLabel(isOwner)}</span></p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>계정</CardTitle>
          <CardDescription>현재 계정에서 로그아웃합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signOutAction}>
            <Button type="submit" variant="secondary" className="w-full">
              로그아웃
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
