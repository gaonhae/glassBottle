import Link from "next/link";

import { PageHeader } from "@/app/components/page-header";
import { buttonVariants } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { cn } from "@/lib/utils";

export default function UnsupportedDevicePage() {
  return (
    <section className="page-stack">
      <PageHeader
        centered
        eyebrow="Mobile only"
        title="모바일 환경에서 가장 잘 작동해요"
        description="이 MVP는 모바일 중심 화면으로 설계되어 있어요. 조금 더 작은 화면에서 다시 열어 주세요."
      />

      <Card className="mx-auto w-full max-w-md">
        <CardContent className="space-y-5 px-6 py-6 text-center">
          <p className="text-sm leading-6 text-slate-500">
            PC에서도 접속은 가능하지만, 현재 경험은 모바일에서 가장 안정적으로 다듬어져 있습니다.
          </p>
          <div className="flex justify-center">
            <Link href="/" className={cn(buttonVariants({ size: "sm" }), "no-underline")}>
              홈으로 돌아가기
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
