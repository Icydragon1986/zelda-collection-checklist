import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function CollapsibleGroup({
  title,
  ownedCount,
  total,
  children,
  defaultOpen = true,
}: {
  title: string;
  ownedCount: number;
  total: number;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const percent = total ? Math.round((ownedCount / total) * 100) : 0;
  const complete = total > 0 && ownedCount === total;

  return (
    <div className="rounded-xl border border-border/60 bg-card/50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-accent/5"
      >
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            !open && "-rotate-90",
          )}
        />
        <span className="text-sm font-semibold tracking-wide">{title}</span>
        <span className={cn("text-xs tabular-nums text-muted-foreground", complete && "font-medium text-primary")}>
          {ownedCount}/{total}
        </span>
        <Progress value={percent} className="ml-auto h-1.5 w-24 sm:w-32" />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="px-3 pb-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
