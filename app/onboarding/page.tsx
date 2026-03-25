import { redirect } from "next/navigation";

import { createFamilyAction } from "@/app/actions";
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
        title="가족을 만들고 초대해 보세요"
        description="먼저 가족을 만들고, 설정 화면에서 초대 링크를 복사해 공유할 수 있습니다."
      />

      {errorMessage ? <StatusMessage variant="error">{errorMessage}</StatusMessage> : null}

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>새 가족 만들기</CardTitle>
            <CardDescription>표시 이름을 정하고, 우리 가족 공간을 바로 시작합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createFamilyAction} className="section-stack">
              <label className="field">
                <span>표시 이름</span>
                <Input name="displayName" maxLength={24} required placeholder="예: 민지, 아빠" />
              </label>
              <label className="field">
                <span>가족 이름</span>
                <Input name="familyName" maxLength={40} required placeholder="예: 우리 가족" />
              </label>
              <Button type="submit">가족 만들기</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>가족 참여는 초대 링크로 진행돼요</CardTitle>
            <CardDescription>이미 가족이 있다면 받은 초대 링크를 열어 바로 참여할 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
            <p>초대 코드를 직접 입력하는 방식은 이 버전에서 사용하지 않습니다.</p>
            <p>가족을 만든 뒤에는 설정 화면에서 초대 링크를 복사해 공유할 수 있습니다.</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
