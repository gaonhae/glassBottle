"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/app/components/ui/button";

type CopyInviteLinkButtonProps = {
  value: string;
};

export function CopyInviteLinkButton({ value }: CopyInviteLinkButtonProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
      timeoutRef.current = setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="secondary" className="w-full" onClick={handleCopy}>
        {status === "copied" ? "초대 링크를 복사했어요" : "초대 링크 복사하기"}
      </Button>
      {status === "copied" ? <p className="text-sm leading-6 text-emerald-700">메신저에 바로 붙여 넣어 공유할 수 있어요.</p> : null}
      {status === "error" ? (
        <p className="text-sm leading-6 text-rose-700">브라우저에서 복사가 막혀 있으면 아래 링크를 직접 복사해 주세요.</p>
      ) : null}
    </div>
  );
}