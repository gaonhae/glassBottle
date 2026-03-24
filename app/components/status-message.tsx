import type { ReactNode } from "react";

import { CheckCircle2, CircleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

type StatusMessageProps = {
  children: ReactNode;
  variant: "success" | "error";
};

export function StatusMessage({ children, variant }: StatusMessageProps) {
  const Icon = variant === "success" ? CheckCircle2 : CircleAlert;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[24px] border px-4 py-3 text-sm leading-6",
        variant === "success"
          ? "border-emerald-200 bg-emerald-50/90 text-emerald-800"
          : "border-rose-200 bg-rose-50/90 text-rose-800"
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
