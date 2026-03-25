"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { safeTrackAdminAnalyticsEvent, safeTrackServerAnalyticsEvent } from "@/lib/analytics";
import { computeSchedule } from "@/lib/delay";
import { buildAuthPath, buildOnboardingPath, getSafeNextPath, normalizeInviteCode } from "@/lib/invite";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUiErrorCode } from "@/lib/ui-text";
import { generateInviteCode } from "@/lib/utils";

const passwordSchema = z.string().min(8).max(72);
const answerBodySchema = z.string().trim().min(1).max(2000);
const commentBodySchema = z.string().trim().min(1).max(800);

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
    message: "Passwords must match"
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

const submitAnswerSchema = z.object({
  questionId: z.string().uuid(),
  bodyText: answerBodySchema
});

const createCommentSchema = z.object({
  answerId: z.string().uuid(),
  bodyText: commentBodySchema
});

async function requireUserContext() {
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
    redirect("/prompts");
  }
}

async function getRequiredMembership(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string) {
  const { data, error } = await supabase
    .from("family_members")
    .select("family_id, display_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    redirect("/onboarding");
  }

  return data;
}

function getInviteCodeFromFormData(formData: FormData) {
  const inviteCode = formData.get("inviteCode");
  return typeof inviteCode === "string" ? normalizeInviteCode(inviteCode) : "";
}

function redirectToJoinOnboarding(inviteCode: string, error: string): never {
  redirect(
    buildOnboardingPath({
      mode: "join",
      inviteCode,
      error
    })
  );
}

export async function signInWithPasswordAction(formData: FormData) {
  const nextPath = getSafeNextPath(formData.get("next"));
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    redirect(buildAuthPath({ mode: "login", next: nextPath, error: "auth-invalid-input" }));
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error) {
    redirect(
      buildAuthPath({
        mode: "login",
        next: nextPath,
        error: getUiErrorCode(error.message)
      })
    );
  }

  redirect(nextPath ?? "/prompts");
}

export async function signUpWithPasswordAction(formData: FormData) {
  const nextPath = getSafeNextPath(formData.get("next"));
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword")
  });

  if (!parsed.success) {
    redirect(buildAuthPath({ mode: "signup", next: nextPath, error: "auth-signup-invalid-input" }));
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error) {
    redirect(
      buildAuthPath({
        mode: "signup",
        next: nextPath,
        error: getUiErrorCode(error.message)
      })
    );
  }

  if (data.user?.id) {
    await safeTrackAdminAnalyticsEvent({
      eventName: "signupCompleted",
      userId: data.user.id
    });
  }

  if (data.session) {
    redirect(nextPath ?? "/onboarding");
  }

  redirect(
    buildAuthPath({
      mode: "login",
      next: nextPath,
      success: "signup-created"
    })
  );
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

  const { supabase, user } = await requireUserContext();
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

  await safeTrackServerAnalyticsEvent({
    eventName: "familyGroupCreated",
    userId: user.id,
    familyId,
    properties: { familyId }
  });

  revalidatePath("/onboarding");
  revalidatePath("/prompts");
  redirect("/prompts");
}

export async function joinFamilyAction(formData: FormData) {
  const inviteCode = getInviteCodeFromFormData(formData);
  const parsed = joinFamilySchema.safeParse({
    inviteCode: formData.get("inviteCode"),
    displayName: formData.get("displayName")
  });

  if (!parsed.success) {
    redirectToJoinOnboarding(inviteCode, "onboarding-invalid-join-input");
  }

  const { supabase, user } = await requireUserContext();
  await ensureNoMembership(supabase, user.id);

  const normalizedCode = normalizeInviteCode(parsed.data.inviteCode);

  const { error: profileError } = await supabase.from("profiles").upsert({
    user_id: user.id,
    email: user.email ?? "",
    display_name: parsed.data.displayName
  });

  if (profileError) {
    redirectToJoinOnboarding(normalizedCode, getUiErrorCode(profileError.message));
  }

  const { data: familyId, error: joinError } = await supabase.rpc("join_family", {
    p_invite_code: normalizedCode,
    p_display_name: parsed.data.displayName
  });

  if (joinError) {
    if (joinError.message.includes("Invalid invite code")) {
      redirectToJoinOnboarding(normalizedCode, "onboarding-invalid-invite-code");
    }

    if (joinError.message.includes("Family member limit reached")) {
      redirectToJoinOnboarding(normalizedCode, "onboarding-family-full");
    }

    redirectToJoinOnboarding(normalizedCode, getUiErrorCode(joinError.message));
  }

  const resolvedFamilyId = typeof familyId === "string" ? familyId : "";

  await safeTrackServerAnalyticsEvent({
    eventName: "familyMemberJoined",
    userId: user.id,
    familyId: resolvedFamilyId || null,
    properties: resolvedFamilyId ? { familyId: resolvedFamilyId } : undefined
  });

  revalidatePath("/onboarding");
  revalidatePath("/prompts");
  redirect("/prompts");
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

  const { supabase, user } = await requireUserContext();
  const membership = await getRequiredMembership(supabase, user.id);

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

  const { data: createdLetter, error: insertError } = await supabase
    .from("letters")
    .insert({
      family_id: membership.family_id,
      sender_user_id: user.id,
      recipient_user_id: parsed.data.recipientId,
      body_text: parsed.data.bodyText,
      status: "scheduled",
      scheduled_at: scheduledAt.toISOString(),
      editable_until: editableUntil.toISOString(),
      timezone_at_send: parsed.data.timezone
    })
    .select("id")
    .single();

  if (insertError || !createdLetter) {
    const message = insertError?.message ?? "letter-invalid-input";
    redirect(`/letters/new?error=${encodeURIComponent(getUiErrorCode(message))}`);
  }

  await safeTrackServerAnalyticsEvent({
    eventName: "bottleLetterCreated",
    userId: user.id,
    familyId: membership.family_id,
    properties: {
      letterId: createdLetter.id,
      recipientId: parsed.data.recipientId
    }
  });

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

  const { supabase, user } = await requireUserContext();

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

  const { supabase, user } = await requireUserContext();

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

export async function submitAnswerAction(formData: FormData) {
  const parsed = submitAnswerSchema.safeParse({
    questionId: formData.get("questionId"),
    bodyText: formData.get("bodyText")
  });

  if (!parsed.success) {
    redirect("/prompts?error=answer-invalid-input");
  }

  const { supabase, user } = await requireUserContext();
  const membership = await getRequiredMembership(supabase, user.id);

  const { data: question, error: questionError } = await supabase
    .from("questions")
    .select("id")
    .eq("id", parsed.data.questionId)
    .maybeSingle();

  if (questionError || !question) {
    redirect(`/prompts/${parsed.data.questionId}?error=answer-invalid-input`);
  }

  const { data: createdAnswer, error: insertError } = await supabase
    .from("answers")
    .insert({
      question_id: parsed.data.questionId,
      family_id: membership.family_id,
      author_user_id: user.id,
      body_text: parsed.data.bodyText
    })
    .select("id")
    .single();

  if (insertError || !createdAnswer) {
    const message = insertError?.message ?? "answer-invalid-input";
    redirect(`/prompts/${parsed.data.questionId}?error=${encodeURIComponent(getUiErrorCode(message))}`);
  }

  await safeTrackServerAnalyticsEvent({
    eventName: "answerCreated",
    userId: user.id,
    familyId: membership.family_id,
    properties: {
      questionId: parsed.data.questionId,
      answerId: createdAnswer.id
    }
  });

  revalidatePath("/prompts");
  revalidatePath(`/prompts/${parsed.data.questionId}`);
  redirect(`/prompts/${parsed.data.questionId}?answered=1`);
}

export async function createAnswerCommentAction(formData: FormData) {
  const parsed = createCommentSchema.safeParse({
    answerId: formData.get("answerId"),
    bodyText: formData.get("bodyText")
  });

  if (!parsed.success) {
    redirect("/prompts?error=comment-invalid-input");
  }

  const { supabase, user } = await requireUserContext();
  const membership = await getRequiredMembership(supabase, user.id);

  const { data: answer, error: answerError } = await supabase
    .from("answers")
    .select("id, question_id, family_id")
    .eq("id", parsed.data.answerId)
    .maybeSingle();

  if (answerError || !answer || answer.family_id !== membership.family_id) {
    redirect(`/answers/${parsed.data.answerId}?error=comment-invalid-answer`);
  }

  const { data: createdComment, error: insertError } = await supabase
    .from("answer_comments")
    .insert({
      answer_id: parsed.data.answerId,
      family_id: membership.family_id,
      author_user_id: user.id,
      body_text: parsed.data.bodyText
    })
    .select("id")
    .single();

  if (insertError || !createdComment) {
    const message = insertError?.message ?? "comment-invalid-input";
    redirect(`/answers/${parsed.data.answerId}?error=${encodeURIComponent(getUiErrorCode(message))}`);
  }

  await safeTrackServerAnalyticsEvent({
    eventName: "commentCreated",
    userId: user.id,
    familyId: membership.family_id,
    properties: {
      answerId: parsed.data.answerId,
      questionId: answer.question_id,
      commentId: createdComment.id
    }
  });

  revalidatePath(`/answers/${parsed.data.answerId}`);
  revalidatePath(`/prompts/${answer.question_id}`);
  redirect(`/answers/${parsed.data.answerId}?commented=1#comments`);
}

export async function updateDisplayNameAction(formData: FormData) {
  const parsed = displayNameSchema.safeParse({
    displayName: formData.get("displayName")
  });

  if (!parsed.success) {
    redirect("/settings?error=settings-invalid-display-name");
  }

  const { supabase, user } = await requireUserContext();

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
  revalidatePath("/prompts");
  revalidatePath("/inbox");
  revalidatePath("/outbox");
  redirect("/settings?updated=1");
}

