import { Check, Minus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Cover } from "@/components/Cover";
import type { Game } from "@/data/types";
import { GAME_COVERS } from "@/data/covers";
import { EMPTY_OWNERSHIP, useCollection } from "@/store/useCollection";
import { cn } from "@/lib/utils";
import { categoryLabel, useI18n } from "@/i18n";

export function GameRow({ game }: { game: Game }) {
  const { language, t } = useI18n();
  const own = useCollection((s) => s.games[game.id]) ?? EMPTY_OWNERSHIP;
  const setFlag = useCollection((s) => s.setGameFlag);
  const anyOwned = own.cartridge || own.manual || own.box || own.cib;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") e.currentTarget.click();
          }}
          className={cn(
            "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors sm:gap-3 sm:px-3",
            "hover:bg-accent/10",
            anyOwned && "bg-primary/5",
          )}
        >
          <StatusIndicator cib={own.cib} any={anyOwned} />
          <Cover id={game.id} src={GAME_COVERS[game.id]} alt={game.title} className="h-28 sm:h-36" />
          <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-3">
            <p className={cn("min-w-0 flex-1 text-sm font-medium", anyOwned && "text-muted-foreground", own.cib && "line-through decoration-primary/40")}>{game.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 sm:mt-0 sm:shrink-0 sm:flex-nowrap">
              {game.category !== "main" && (
                <Badge
                  variant={game.category === "curiosity" ? "destructive" : "outline"}
                  className="h-6 border-primary/35 bg-primary/5 px-2.5 text-[11px] font-medium text-foreground"
                >
                  {categoryLabel(game.category, language)}
                </Badge>
              )}
              <span className="text-xs tabular-nums text-muted-foreground sm:w-11 sm:text-right">{game.year}</span>
            </div>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <p className="mb-3 text-sm font-semibold">{game.title}</p>
        <div className="flex flex-col gap-2.5">
          <OwnershipToggle
            label={t("ownership.media")}
            checked={own.cartridge}
            disabled={own.cib}
            onChange={(v) => setFlag(game.id, "cartridge", v)}
          />
          <OwnershipToggle
            label={t("ownership.manual")}
            checked={own.manual}
            disabled={own.cib}
            onChange={(v) => setFlag(game.id, "manual", v)}
          />
          <OwnershipToggle
            label={t("ownership.box")}
            checked={own.box}
            disabled={own.cib}
            onChange={(v) => setFlag(game.id, "box", v)}
          />
          <div className="my-0.5 h-px bg-border" />
          <OwnershipToggle
            label={t("ownership.cib")}
            checked={own.cib}
            onChange={(v) => setFlag(game.id, "cib", v)}
            emphasis
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function OwnershipToggle({
  label,
  checked,
  disabled,
  onChange,
  emphasis,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
  emphasis?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2.5 text-sm",
        disabled && "cursor-not-allowed opacity-40",
        emphasis && "font-medium text-primary",
      )}
    >
      <Checkbox checked={checked} disabled={disabled} onCheckedChange={(v) => onChange(v === true)} />
      {label}
    </label>
  );
}

function StatusIndicator({ cib, any }: { cib: boolean; any: boolean }) {
  return (
    <div
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
        cib
          ? "border-primary bg-primary text-primary-foreground"
          : any
            ? "border-primary/50 bg-primary/15 text-primary"
            : "border-input",
      )}
    >
      {cib && <Check className="size-3" />}
      {!cib && any && <Minus className="size-3" />}
    </div>
  );
}
