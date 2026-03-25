import Link from "next/link";
import { redirect } from "next/navigation";

import { signInWithPasswordAction, signUpWithPasswordAction } from "@/app/actions";
import { PageHeader } from "@/app/components/page-header";
import { StatusMessage } from "@/app/components/status-message";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { getMembership } from "@/lib/auth";
import { buildAuthPath, getSafeNextPath } from "@/lib/invite";
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
  const params = await searchParams;
  const nextPath = getSafeNextPath(readParam(params, "next"));
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    const membership = await getMembership(user.id);
    redirect(nextPath ?? (membership ? "/prompts" : "/onboarding"));
  }

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
        title={isSignupMode ? "?? ??? ??? ??? ????" : "?? ???? ? ?????"}
        description="???? ????? ?????, ??? ???? ??? ??? ???."
      />

      <Card className="mx-auto w-full max-w-md">
        <CardContent className="space-y-6 px-6 py-6">
          <div className="grid grid-cols-2 rounded-full bg-slate-100 p-1">
            <Link
              href={buildAuthPath({ mode: "login", next: nextPath })}
              className={cn(
                "rounded-full px-4 py-2 text-center text-sm font-semibold no-underline transition-all",
                isSignupMode ? "text-slate-500 hover:text-slate-900" : "bg-white text-slate-950 shadow-sm"
              )}
            >
              ???
            </Link>
            <Link
              href={buildAuthPath({ mode: "signup", next: nextPath })}
              className={cn(
                "rounded-full px-4 py-2 text-center text-sm font-semibold no-underline transition-all",
                isSignupMode ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              ????
            </Link>
          </div>

          {success === "signup-created" ? <StatusMessage variant="success">??? ???????. ?? ???? ???.</StatusMessage> : null}
          {errorMessage ? <StatusMessage variant="error">{errorMessage}</StatusMessage> : null}

          {isSignupMode ? (
            <form action={signUpWithPasswordAction} className="section-stack">
              {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
              <label className="field">
                <span>???</span>
                <Input name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
              </label>
              <label className="field">
                <span>????</span>
                <Input name="password" type="password" required autoComplete="new-password" minLength={8} maxLength={72} />
              </label>
              <label className="field">
                <span>???? ??</span>
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
                ??????
              </Button>
            </form>
          ) : (
            <form action={signInWithPasswordAction} className="section-stack">
              {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
              <label className="field">
                <span>???</span>
                <Input name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
              </label>
              <label className="field">
                <span>????</span>
                <Input name="password" type="password" required autoComplete="current-password" minLength={8} maxLength={72} />
              </label>
              <Button type="submit" className="w-full">
                ?????
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
