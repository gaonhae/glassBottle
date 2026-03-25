import Link from "next/link";
import { redirect } from "next/navigation";

import { signInWithPasswordAction, signUpWithPasswordAction } from "@/app/actions";
import { PageHeader } from "@/app/components/page-header";
import { StatusMessage } from "@/app/components/status-message";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { getMembership } from "@/lib/auth";
import { getAuthPath, sanitizeNextPath } from "@/lib/invite-links";
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

  const params = await searchParams;
  const modeParam = readParam(params, "mode");
  const mode = modeParam === "signup" ? "signup" : "login";
  const isSignupMode = mode === "signup";
  const success = readParam(params, "success");
  const error = readParam(params, "error");
  const nextParam = readParam(params, "next");
  const nextPath = nextParam ? sanitizeNextPath(nextParam, "/onboarding") : "";
  const errorMessage = error ? getUiErrorMessage(error) : "";

  if (user) {
    const membership = await getMembership(user.id);
    redirect(membership ? "/prompts" : nextPath || "/onboarding");
  }

  return (
    <section className="page-stack">
      <PageHeader
        centered
        eyebrow="Account"
        title={isSignupMode ? "가족 참여를 위해 가입해 주세요" : "가족 참여를 위해 로그인해 주세요"}
        description="초대 링크를 이어서 열 수 있도록 로그인 후 다시 같은 흐름으로 돌아옵니다."
      />

      <Card className="mx-auto w-full max-w-md">
        <CardContent className="space-y-6 px-6 py-6">
          <div className="grid grid-cols-2 rounded-full bg-slate-100 p-1">
            <Link
              href={getAuthPath({ mode: "login", nextPath })}
              className={cn(
                "rounded-full px-4 py-2 text-center text-sm font-semibold no-underline transition-all",
                isSignupMode ? "text-slate-500 hover:text-slate-900" : "bg-white text-slate-950 shadow-sm"
              )}
            >
              로그인
            </Link>
            <Link
              href={getAuthPath({ mode: "signup", nextPath })}
              className={cn(
                "rounded-full px-4 py-2 text-center text-sm font-semibold no-underline transition-all",
                isSignupMode ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              회원가입
            </Link>
          </div>

          {success === "signup-created" ? <StatusMessage variant="success">가입이 완료되었습니다. 바로 로그인해 주세요.</StatusMessage> : null}
          {errorMessage ? <StatusMessage variant="error">{errorMessage}</StatusMessage> : null}

          {isSignupMode ? (
            <form action={signUpWithPasswordAction} className="section-stack">
              {nextPath ? <input type="hidden" name="nextPath" value={nextPath} /> : null}
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
                회원가입
              </Button>
            </form>
          ) : (
            <form action={signInWithPasswordAction} className="section-stack">
              {nextPath ? <input type="hidden" name="nextPath" value={nextPath} /> : null}
              <label className="field">
                <span>이메일</span>
                <Input name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
              </label>
              <label className="field">
                <span>비밀번호</span>
                <Input name="password" type="password" required autoComplete="current-password" minLength={8} maxLength={72} />
              </label>
              <Button type="submit" className="w-full">
                로그인
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
