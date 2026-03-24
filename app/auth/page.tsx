import Link from "next/link";
import { redirect } from "next/navigation";

import { signInWithPasswordAction, signUpWithPasswordAction } from "@/app/actions";
import { PageHeader } from "@/app/components/page-header";
import { StatusMessage } from "@/app/components/status-message";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { getMembership } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUiErrorMessage } from "@/lib/ui-text";
import { cn } from "@/lib/utils";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];

  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] : value;
}

export default async function AuthPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    const membership = await getMembership(user.id);
    redirect(membership ? "/prompts" : "/onboarding");
  }

  const params = await searchParams;
  const modeParam = readParam(params, "mode");
  const mode = modeParam === "signup" ? "signup" : "login";
  const isSignupMode = mode === "signup";
  const success = readParam(params, "success");
  const error = readParam(params, "error");
  const errorMessage = error ? getUiErrorMessage(error) : "";

  return (
    <section className="page-stack">
      <PageHeader
        centered
        eyebrow="Account"
        title={isSignupMode ? "가족 공간을 시작할 준비가 되었어요" : "다시 돌아오신 걸 환영합니다"}
        description="이메일과 비밀번호로 로그인하고, 느리게 도착하는 대화를 시작해 보세요."
      />

      <Card className="mx-auto w-full max-w-md">
        <CardContent className="space-y-6 px-6 py-6">
          <div className="grid grid-cols-2 rounded-full bg-slate-100 p-1">
            <Link
              href="/auth?mode=login"
              className={cn(
                "rounded-full px-4 py-2 text-center text-sm font-semibold no-underline transition-all",
                isSignupMode ? "text-slate-500 hover:text-slate-900" : "bg-white text-slate-950 shadow-sm"
              )}
            >
              로그인
            </Link>
            <Link
              href="/auth?mode=signup"
              className={cn(
                "rounded-full px-4 py-2 text-center text-sm font-semibold no-underline transition-all",
                isSignupMode ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              회원가입
            </Link>
          </div>

          {success === "signup-created" ? <StatusMessage variant="success">가입이 완료되었습니다. 이제 로그인해 주세요.</StatusMessage> : null}
          {errorMessage ? <StatusMessage variant="error">{errorMessage}</StatusMessage> : null}

          {isSignupMode ? (
            <form action={signUpWithPasswordAction} className="section-stack">
              <label className="field">
                <span>이메일</span>
                <Input name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
              </label>
              <label className="field">
                <span>비밀번호</span>
                <Input name="password" type="password" required autoComplete="new-password" minLength={8} maxLength={72} />
              </label>
              <label className="field">
                <span>비밀번호 확인</span>
                <Input
                  name="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                />
              </label>
              <Button type="submit" className="w-full">
                회원가입하기
              </Button>
            </form>
          ) : (
            <form action={signInWithPasswordAction} className="section-stack">
              <label className="field">
                <span>이메일</span>
                <Input name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
              </label>
              <label className="field">
                <span>비밀번호</span>
                <Input name="password" type="password" required autoComplete="current-password" minLength={8} maxLength={72} />
              </label>
              <Button type="submit" className="w-full">
                로그인하기
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
