import Link from "next/link";

import { signInWithPasswordAction, signUpWithPasswordAction } from "@/app/actions";
import { getUiErrorMessage } from "@/lib/ui-text";

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
  const modeParam = readParam(params, "mode");
  const mode = modeParam === "signup" ? "signup" : "login";
  const isSignupMode = mode === "signup";
  const success = readParam(params, "success");
  const error = readParam(params, "error");
  const errorMessage = error ? getUiErrorMessage(error) : "";

  return (
    <section className="card stack">
      <h1>{isSignupMode ? "계정 만들기" : "로그인"}</h1>
      <p className="muted">이메일과 비밀번호로 계정에 접속하세요.</p>
      <div className="actions">
        <Link href="/auth?mode=login">
          <button type="button" className={isSignupMode ? "secondary" : ""}>
            로그인
          </button>
        </Link>
        <Link href="/auth?mode=signup">
          <button type="button" className={isSignupMode ? "" : "secondary"}>
            회원가입
          </button>
        </Link>
      </div>
      {success === "signup-created" && <p className="success">계정이 생성되었습니다. 로그인해 주세요.</p>}
      {errorMessage && <p className="error">{errorMessage}</p>}
      {isSignupMode ? (
        <form action={signUpWithPasswordAction} className="stack">
          <label>
            이메일
            <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
          </label>
          <label>
            비밀번호
            <input name="password" type="password" required autoComplete="new-password" minLength={8} maxLength={72} />
          </label>
          <label>
            비밀번호 확인
            <input
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
            />
          </label>
          <button type="submit">계정 만들기</button>
        </form>
      ) : (
        <form action={signInWithPasswordAction} className="stack">
          <label>
            이메일
            <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
          </label>
          <label>
            비밀번호
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              minLength={8}
              maxLength={72}
            />
          </label>
          <button type="submit">로그인</button>
        </form>
      )}
    </section>
  );
}
