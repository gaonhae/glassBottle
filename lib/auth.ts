import { type User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FamilyMemberRecord } from "@/lib/types";

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

export async function getMembership(userId: string): Promise<FamilyMemberRecord | null> {
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

export async function requireMembership(userId: string): Promise<FamilyMemberRecord> {
  const membership = await getMembership(userId);

  if (!membership) {
    redirect("/onboarding");
  }

  return membership;
}
