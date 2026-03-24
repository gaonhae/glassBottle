import { redirect } from "next/navigation";

import { createFamilyAction, joinFamilyAction } from "@/app/actions";
import { PageHeader } from "@/app/components/page-header";
import { StatusMessage } from "@/app/components/status-message";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
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
    redirect("/prompts");
  }

  const params = await searchParams;
  const error = readParam(params, "error");
  const errorMessage = error ? getUiErrorMessage(error) : "";

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Onboarding"
        title="가족 공간을 시작해 볼까요?"
        description="새로운 가족 공간을 만들거나, 초대 코드를 사용해 기존 공간에 참여할 수 있습니다."
      />

      {errorMessage ? <StatusMessage variant="error">{errorMessage}</StatusMessage> : null}

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>새 가족 공간 만들기</CardTitle>
            <CardDescription>먼저 공간을 만들고, 초대 코드를 가족에게 공유하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createFamilyAction} className="section-stack">
              <label className="field">
                <span>내 표시 이름</span>
                <Input name="displayName" maxLength={24} required placeholder="예: 민지, 엄마" />
              </label>
              <label className="field">
                <span>가족 이름</span>
                <Input name="familyName" maxLength={40} required placeholder="예: 김씨 가족" />
              </label>
              <Button type="submit">가족 공간 만들기</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>초대 코드로 참여하기</CardTitle>
            <CardDescription>가족에게 받은 초대 코드를 입력하면 바로 합류할 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={joinFamilyAction} className="section-stack">
              <label className="field">
                <span>내 표시 이름</span>
                <Input name="displayName" maxLength={24} required placeholder="예: 민지, 엄마" />
              </label>
              <label className="field">
                <span>초대 코드</span>
                <Input name="inviteCode" required placeholder="ABCD2345" className="uppercase tracking-[0.22em]" />
              </label>
              <Button type="submit" variant="secondary">
                가족 공간 참여하기
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
