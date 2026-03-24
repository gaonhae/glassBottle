import Link from "next/link";

import { BRAND_NAME } from "@/lib/ui-text";

export default async function HomePage() {
  return (
    <section className="card stack">
      <h1>솔직한 가족의 마음을, 조금 늦게 전하세요.</h1>
      <p className="muted">
        {BRAND_NAME}은 마음의 준비가 되었을 때 솔직한 편지를 쓰고, 제출 후 5시간에서 72시간 사이의 임의 시점에
        전달되도록 돕습니다.
      </p>
      <div className="actions">
        <Link href="/auth">
          <button type="button">이메일과 비밀번호로 시작하기</button>
        </Link>
      </div>
    </section>
  );
}
