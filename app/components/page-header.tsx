import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description: string;
  eyebrow?: string;
  action?: ReactNode;
  centered?: boolean;
};

export function PageHeader({ title, description, eyebrow, action, centered = false }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4", centered ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between")}>
      <div className={cn("space-y-3", centered ? "max-w-xl" : "max-w-lg")}>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">{eyebrow}</p> : null}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
          <p className="text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      {action ? <div className={cn(centered ? "pt-2" : "shrink-0")}>{action}</div> : null}
    </div>
  );
}
