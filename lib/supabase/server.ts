import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getValidatedRuntimeEnv } from "@/lib/env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const runtimeEnv = getValidatedRuntimeEnv();

  return createServerClient(runtimeEnv.NEXT_PUBLIC_SUPABASE_URL, runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Cookies can only be set from middleware/route handlers.
        }
      }
    }
  });
}
