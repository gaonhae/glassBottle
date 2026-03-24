import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Clock3, LockKeyhole, Users } from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import { buttonVariants } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { getMembership } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BRAND_NAME } from "@/lib/ui-text";
import { cn } from "@/lib/utils";

const highlights = [
  {
    title: "익명으로 남기는 편지",
    description: "보내는 사람의 이름 대신 마음의 결만 남도록 설계했습니다.",
    icon: LockKeyhole
  },
  {
    title: "5시간에서 72시간 사이의 지연",
    description: "바로 반응하지 않아도 되는 시간차가 대화를 더 부드럽게 만듭니다.",
    icon: Clock3
  },
  {
    title: "가족만을 위한 private space",
    description: "한 가족 안에서만 질문과 답변, 편지가 오가도록 범위를 좁혔습니다.",
    icon: Users
  }
];

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    const membership = await getMembership(user.id);
    redirect(membership ? "/prompts" : "/onboarding");
  }

  return (
    <section className="page-stack">
      <Card className="overflow-hidden border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(242,246,255,0.94))]">
        <CardContent className="space-y-8 px-6 py-8">
          <div className="space-y-4">
            <Badge variant="accent">Calm family conversation</Badge>
            <div className="space-y-4">
              <h1 className="max-w-sm font-serif text-[2.4rem] leading-tight text-slate-950">
                가족 사이에 조금 더 솔직한 말을 남겨보세요.
              </h1>
              <p className="max-w-sm text-sm leading-7 text-slate-600">
                {BRAND_NAME}은 편지를 바로 보내지 않습니다. 익명으로 적은 마음이 몇 시간 뒤 도착하도록 설계해,
                더 천천히 읽고 더 오래 남는 대화를 돕습니다.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/auth" className={cn(buttonVariants({ size: "lg" }), "no-underline")}>
              시작하기
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="flex items-center text-sm leading-6 text-slate-500">
              가입 후 가족 공간을 만들거나, 초대 코드로 바로 합류할 수 있습니다.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {highlights.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.title} className="bg-white/82">
              <CardContent className="flex gap-4 px-5 py-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-slate-100 text-slate-700">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="space-y-1.5">
                  <h2 className="text-base font-semibold text-slate-950">{item.title}</h2>
                  <p className="text-sm leading-6 text-slate-500">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
