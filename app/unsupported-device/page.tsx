import { AnalyticsPageView } from "@/app/components/analytics-page-view";
import { PageHeader } from "@/app/components/page-header";
import { Card, CardContent } from "@/app/components/ui/card";

export default function UnsupportedDevicePage() {
  return (
    <section className="page-stack">
      <AnalyticsPageView eventName="unsupportedDeviceViewed" />

      <PageHeader
        centered
        eyebrow="Mobile only"
        title="모바일에서만 사용할 수 있어요"
        description="이 MVP는 스마트폰 브라우저 경험에 맞춰 설계되어 있어요. 휴대폰에서 다시 접속해 주세요."
      />

      <Card className="mx-auto w-full max-w-md">
        <CardContent className="space-y-5 px-6 py-6 text-center">
          <p className="text-sm leading-6 text-slate-500">
            PC에서는 안내 화면만 보여드리고, 실제 서비스 화면은 모바일에서만 열립니다.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
