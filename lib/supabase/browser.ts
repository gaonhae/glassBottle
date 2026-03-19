import { createBrowserClient } from "@supabase/ssr";

import { getValidatedRuntimeEnv } from "@/lib/env";

export function createSupabaseBrowserClient() {
  const runtimeEnv = getValidatedRuntimeEnv();

  return createBrowserClient(runtimeEnv.NEXT_PUBLIC_SUPABASE_URL, runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
