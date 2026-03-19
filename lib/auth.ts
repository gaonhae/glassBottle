import { type User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireUser(): Promise<User> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return user;
}

export async function getMembership(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("family_members")
    .select("family_id, display_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
