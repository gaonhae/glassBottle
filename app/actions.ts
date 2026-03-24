"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { computeSchedule } from "@/lib/delay";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUiErrorCode } from "@/lib/ui-text";
import { generateInviteCode } from "@/lib/utils";

const passwordSchema = z.string().min(8).max(72);

const signInSchema = z.object({
  email: z.string().email(),
  password: passwordSchema
});

const signUpSchema = z
  .object({
    email: z.string().email(),
    password: passwordSchema,
    confirmPassword: passwordSchema
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "비밀번호가 서로 일치하지 않습니다."
  });

const createFamilySchema = z.object({
  familyName: z.string().trim().min(2).max(40),
  displayName: z.string().trim().min(1).max(24)
});

const joinFamilySchema = z.object({
  inviteCode: z.string().trim().min(6).max(16),
  displayName: z.string().trim().min(1).max(24)
});

const sendLetterSchema = z.object({
  recipientId: z.string().uuid(),
  bodyText: z.string().trim().min(1).max(2000),
  timezone: z.string().trim().min(1).max(80)
});

const updateLetterSchema = z.object({
  letterId: z.string().uuid(),
  bodyText: z.string().trim().min(1).max(2000)
});

const cancelLetterSchema = z.object({
  letterId: z.string().uuid()
});

const displayNameSchema = z.object({
  displayName: z.string().trim().min(1).max(24)
});

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return { supabase, user };
}

async function ensureNoMembership(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string) {
  const { data, error } = await supabase.from("family_members").select("id").eq("user_id", userId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    redirect("/inbox");
  }
}

export async function signInWithPasswordAction(formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    redirect("/auth?mode=login&error=auth-invalid-input");
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error) {
    redirect(`/auth?mode=login&error=${encodeURIComponent(getUiErrorCode(error.message))}`);
  }

  redirect("/onboarding");
}

export async function signUpWithPasswordAction(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword")
  });

  if (!parsed.success) {
    redirect("/auth?mode=signup&error=auth-signup-invalid-input");
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error) {
    redirect(`/auth?mode=signup&error=${encodeURIComponent(getUiErrorCode(error.message))}`);
  }

  if (data.session) {
    redirect("/onboarding");
  }

  redirect("/auth?mode=login&success=signup-created");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/auth");
}

export async function createFamilyAction(formData: FormData) {
  const parsed = createFamilySchema.safeParse({
    familyName: formData.get("familyName"),
    displayName: formData.get("displayName")
  });

  if (!parsed.success) {
    redirect("/onboarding?error=onboarding-invalid-create-input");
  }

  const { supabase, user } = await requireUser();
  await ensureNoMembership(supabase, user.id);

  const email = user.email ?? "";

  const { error: profileError } = await supabase.from("profiles").upsert({
    user_id: user.id,
    email,
    display_name: parsed.data.displayName
  });

  if (profileError) {
    redirect(`/onboarding?error=${encodeURIComponent(getUiErrorCode(profileError.message))}`);
  }

  let familyId = "";

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const inviteCode = generateInviteCode(8);
    const { data, error } = await supabase.rpc("create_family", {
      p_name: parsed.data.familyName,
      p_invite_code: inviteCode,
      p_display_name: parsed.data.displayName
    });

    if (!error) {
      familyId = typeof data === "string" ? data : "";
      break;
    }

    if (error.code !== "23505") {
      redirect(`/onboarding?error=${encodeURIComponent(getUiErrorCode(error.message))}`);
    }
  }

  if (!familyId) {
    redirect("/onboarding?error=onboarding-invite-code-generation-failed");
  }

  revalidatePath("/onboarding");
  redirect("/inbox");
}

export async function joinFamilyAction(formData: FormData) {
  const parsed = joinFamilySchema.safeParse({
    inviteCode: formData.get("inviteCode"),
    displayName: formData.get("displayName")
  });

  if (!parsed.success) {
    redirect("/onboarding?error=onboarding-invalid-join-input");
  }

  const { supabase, user } = await requireUser();
  await ensureNoMembership(supabase, user.id);

  const normalizedCode = parsed.data.inviteCode.toUpperCase();

  const { error: profileError } = await supabase.from("profiles").upsert({
    user_id: user.id,
    email: user.email ?? "",
    display_name: parsed.data.displayName
  });

  if (profileError) {
    redirect(`/onboarding?error=${encodeURIComponent(getUiErrorCode(profileError.message))}`);
  }

  const { error: joinError } = await supabase.rpc("join_family", {
    p_invite_code: normalizedCode,
    p_display_name: parsed.data.displayName
  });

  if (joinError) {
    if (joinError.message.includes("Invalid invite code")) {
      redirect("/onboarding?error=onboarding-invalid-invite-code");
    }

    if (joinError.message.includes("Family member limit reached")) {
      redirect("/onboarding?error=onboarding-family-full");
    }

    redirect(`/onboarding?error=${encodeURIComponent(getUiErrorCode(joinError.message))}`);
  }

  revalidatePath("/onboarding");
  redirect("/inbox");
}

export async function sendLetterAction(formData: FormData) {
  const parsed = sendLetterSchema.safeParse({
    recipientId: formData.get("recipientId"),
    bodyText: formData.get("bodyText"),
    timezone: formData.get("timezone")
  });

  if (!parsed.success) {
    redirect("/letters/new?error=letter-invalid-input");
  }

  const { supabase, user } = await requireUser();

  const { data: membership, error: membershipError } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .single();

  if (membershipError) {
    redirect("/onboarding");
  }

  const { data: recipient, error: recipientError } = await supabase
    .from("family_members")
    .select("user_id")
    .eq("family_id", membership.family_id)
    .eq("user_id", parsed.data.recipientId)
    .single();

  if (recipientError || !recipient || recipient.user_id === user.id) {
    redirect("/letters/new?error=letter-invalid-recipient");
  }

  const now = new Date();
  const { scheduledAt } = computeSchedule(now);
  const editableUntil = new Date(now.getTime() + 5 * 60 * 1000);

  const { error: insertError } = await supabase.from("letters").insert({
    family_id: membership.family_id,
    sender_user_id: user.id,
    recipient_user_id: parsed.data.recipientId,
    body_text: parsed.data.bodyText,
    status: "scheduled",
    scheduled_at: scheduledAt.toISOString(),
    editable_until: editableUntil.toISOString(),
    timezone_at_send: parsed.data.timezone
  });

  if (insertError) {
    redirect(`/letters/new?error=${encodeURIComponent(getUiErrorCode(insertError.message))}`);
  }

  revalidatePath("/outbox");
  revalidatePath("/letters/new");
  redirect("/outbox?sent=1");
}

export async function updateScheduledLetterAction(formData: FormData) {
  const parsed = updateLetterSchema.safeParse({
    letterId: formData.get("letterId"),
    bodyText: formData.get("bodyText")
  });

  if (!parsed.success) {
    redirect("/outbox?error=letter-invalid-update-input");
  }

  const { supabase, user } = await requireUser();

  const { data: updatedLetter, error } = await supabase
    .from("letters")
    .update({
      body_text: parsed.data.bodyText
    })
    .eq("id", parsed.data.letterId)
    .eq("sender_user_id", user.id)
    .eq("status", "scheduled")
    .gt("editable_until", new Date().toISOString())
    .select("id")
    .maybeSingle();

  if (error || !updatedLetter) {
    const message = error?.message ?? "letter-update-window-expired";
    redirect(`/outbox?error=${encodeURIComponent(getUiErrorCode(message))}`);
  }

  revalidatePath("/outbox");
  redirect("/outbox?updated=1");
}

export async function cancelScheduledLetterAction(formData: FormData) {
  const parsed = cancelLetterSchema.safeParse({
    letterId: formData.get("letterId")
  });

  if (!parsed.success) {
    redirect("/outbox?error=letter-invalid-cancel-input");
  }

  const { supabase, user } = await requireUser();

  const { data: canceledLetter, error } = await supabase
    .from("letters")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString()
    })
    .eq("id", parsed.data.letterId)
    .eq("sender_user_id", user.id)
    .eq("status", "scheduled")
    .gt("editable_until", new Date().toISOString())
    .select("id")
    .maybeSingle();

  if (error || !canceledLetter) {
    const message = error?.message ?? "letter-cancel-window-expired";
    redirect(`/outbox?error=${encodeURIComponent(getUiErrorCode(message))}`);
  }

  revalidatePath("/outbox");
  redirect("/outbox?canceled=1");
}

export async function updateDisplayNameAction(formData: FormData) {
  const parsed = displayNameSchema.safeParse({
    displayName: formData.get("displayName")
  });

  if (!parsed.success) {
    redirect("/settings?error=settings-invalid-display-name");
  }

  const { supabase, user } = await requireUser();

  const { error: profileError } = await supabase.from("profiles").upsert({
    user_id: user.id,
    email: user.email ?? "",
    display_name: parsed.data.displayName
  });

  if (profileError) {
    redirect(`/settings?error=${encodeURIComponent(getUiErrorCode(profileError.message))}`);
  }

  const { error: memberError } = await supabase
    .from("family_members")
    .update({ display_name: parsed.data.displayName })
    .eq("user_id", user.id);

  if (memberError) {
    redirect(`/settings?error=${encodeURIComponent(getUiErrorCode(memberError.message))}`);
  }

  revalidatePath("/settings");
  redirect("/settings?updated=1");
}
