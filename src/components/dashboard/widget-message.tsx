import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "muted" | "warning" | "danger";

const TONE_STYLES: Record<Tone, string> = {
  muted: "text-muted-foreground bg-muted",
  warning: "text-amber-600 dark:text-amber-500 bg-amber-500/10",
  danger: "text-destructive bg-destructive/10",
};

interface WidgetMessageProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  tone?: Tone;
  action?: ReactNode;
}

/** Centered, self-contained state block for any non-ok widget result. */
export function WidgetMessage({
  icon: Icon,
  title,
  description,
  tone = "muted",
  action,
}: WidgetMessageProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
      <div className={cn("flex size-9 items-center justify-center rounded-full", TONE_STYLES[tone])}>
        <Icon className="size-4.5" aria-hidden />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {description ? (
        <p className="text-muted-foreground max-w-[38ch] text-xs">{description}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
