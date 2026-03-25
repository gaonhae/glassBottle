import Link from "next/link";

import { EmptyState } from "@/app/components/empty-state";
import { PageHeader } from "@/app/components/page-header";
import { Badge } from "@/app/components/ui/badge";
import { buttonVariants } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { requireMembership, requireUser } from "@/lib/auth";
import { promoteDueLettersForUser } from "@/lib/letters-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getLetterStatusLabel } from "@/lib/ui-text";
import { cn, formatDate, snippet } from "@/lib/utils";

export default async function InboxPage() {
  const user = await requireUser();
  const membership = await requireMembership(user.id);
  await promoteDueLettersForUser(user.id);
  const supabase = await createSupabaseServerClient();

  const [{ data: letters, error: lettersError }, { data: members, error: membersError }] = await Promise.all([
    supabase
      .from("letters")
      .select("id, sender_user_id, body_text, status, created_at")
      .eq("recipient_user_id", user.id)
      .in("status", ["delivered", "read"])
      .order("delivered_at", { ascending: false }),
    supabase.from("family_members").select("user_id, display_name").eq("family_id", membership.family_id)
  ]);

  if (lettersError) {
    throw new Error(lettersError.message);
  }

  if (membersError) {
    throw new Error(membersError.message);
  }

  const displayNameByUserId = new Map((members ?? []).map((member) => [member.user_id, member.display_name]));

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Inbox"
        title="받은 편지"
        description="가족이 보낸 편지가 시간이 지나 도착하면 이곳에 차곡차곡 쌓입니다."
        action={
          <Link href="/letters/new" className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "no-underline")}>
            새 편지 쓰기
          </Link>
        }
      />

      {letters && letters.length > 0 ? (
        <div className="grid gap-3">
          {letters.map((letter) => (
            <Card key={letter.id}>
              <CardContent className="space-y-4 px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <Badge variant={letter.status === "read" ? "success" : "accent"}>{getLetterStatusLabel(letter.status)}</Badge>
                  <span className="text-sm text-slate-400">작성일 {formatDate(letter.created_at)}</span>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm text-slate-500">보낸 사람: {displayNameByUserId.get(letter.sender_user_id) ?? "이름 없음"}</p>
                  <p className="text-sm leading-6 text-slate-700">{snippet(letter.body_text)}</p>
                </div>
                <Link href={`/letters/${letter.id}`} className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "w-fit no-underline")}>
                  편지 열어보기
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="아직 도착한 편지가 없어요"
          description="가족이 보낸 편지가 전달되면 이곳에서 가장 먼저 읽을 수 있습니다."
          action={
            <Link href="/letters/new" className={cn(buttonVariants({ size: "sm" }), "no-underline")}>
              먼저 편지 보내기
            </Link>
          }
        />
      )}
    </section>
  );
}
