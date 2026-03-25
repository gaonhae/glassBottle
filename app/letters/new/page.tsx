import { redirect } from "next/navigation";

import { sendLetterAction } from "@/app/actions";
import { PageHeader } from "@/app/components/page-header";
import { StatusMessage } from "@/app/components/status-message";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Select } from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { requireMembership, requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUiErrorMessage } from "@/lib/ui-text";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];

  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] : value;
}

export default async function NewLetterPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const membership = await requireMembership(user.id);
  const supabase = await createSupabaseServerClient();

  const { data: recipients, error } = await supabase
    .from("family_members")
    .select("user_id, display_name")
    .eq("family_id", membership.family_id)
    .neq("user_id", user.id)
    .order("display_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const params = await searchParams;
  const errorMessage = readParam(params, "error");
  const localizedErrorMessage = errorMessage ? getUiErrorMessage(errorMessage) : "";

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="New letter"
        title="익명 편지 보내기"
        description="편지는 바로 전달되지 않고, 5시간에서 72시간 사이의 임의 시점에 도착합니다."
      />

      {localizedErrorMessage ? <StatusMessage variant="error">{localizedErrorMessage}</StatusMessage> : null}

      <Card>
        <CardContent className="space-y-5 px-6 py-6">
          {recipients && recipients.length > 0 ? (
            <form action={sendLetterAction} className="section-stack">
              <label className="field">
                <span>받는 사람</span>
                <Select name="recipientId" required defaultValue="">
                  <option value="" disabled>
                    가족 구성원을 선택해 주세요
                  </option>
                  {recipients.map((recipient) => (
                    <option key={recipient.user_id} value={recipient.user_id}>
                      {recipient.display_name}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="field">
                <span>편지 내용</span>
                <Textarea
                  name="bodyText"
                  required
                  maxLength={2000}
                  placeholder="바로 말하기 어려웠던 마음을 천천히 적어 보세요."
                />
                <p className="field-hint">최대 2,000자까지 입력할 수 있습니다.</p>
              </label>

              <Button type="submit">편지 보내기</Button>
            </form>
          ) : (
            <StatusMessage variant="error">편지를 받을 가족 구성원이 아직 없습니다. 먼저 가족이 참여해야 해요.</StatusMessage>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/80">
        <CardHeader>
          <CardTitle>전달 방식 안내</CardTitle>
          <CardDescription>glassbottle의 편지는 조금 느리게 도착하도록 설계되어 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm leading-6 text-slate-600">
            <li>보낸 사람의 이름은 받는 사람에게 노출되지 않습니다.</li>
            <li>보낸 뒤 5분 안에는 내용을 수정하거나 전송을 취소할 수 있습니다.</li>
            <li>도착 시점은 5시간에서 72시간 사이에서 임의로 결정됩니다.</li>
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
