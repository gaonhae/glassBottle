import { requestMagicLinkAction } from "@/app/actions";

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
  const sent = readParam(params, "sent");
  const error = readParam(params, "error");

  return (
    <section className="card stack">
      <h1>Sign in with magic link</h1>
      <p className="muted">Enter your email. We send a login link with no password required.</p>
      {sent === "1" && <p className="success">Magic link sent. Check your email inbox.</p>}
      {error && <p className="error">{decodeURIComponent(error)}</p>}
      <form action={requestMagicLinkAction} className="stack">
        <label>
          Email
          <input name="email" type="email" required placeholder="you@example.com" />
        </label>
        <button type="submit">Send magic link</button>
      </form>
    </section>
  );
}
