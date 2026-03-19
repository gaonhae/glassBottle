import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getValidatedRuntimeEnv } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  const runtimeEnv = getValidatedRuntimeEnv();
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient(runtimeEnv.NEXT_PUBLIC_SUPABASE_URL, runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        response = NextResponse.next({
          request
        });

        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  await supabase.auth.getUser();

  return response;
}
