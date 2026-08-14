import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Cover } from "@/components/Cover";
import { EMPTY_AMIIBO_OWNERSHIP, useCollection } from "@/store/useCollection";
import { AMIIBO_COVERS } from "@/data/amiiboCovers";
import { cn } from "@/lib/utils";
import type { Amiibo } from "@/data/types";
import { useI18n } from "@/i18n";

export function AmiiboCard({ item, ownershipId = item.id, coverSrc, boxed = false }: { item: Amiibo; ownershipId?: string; coverSrc?: string; boxed?: boolean }) {
  const { t } = useI18n();
  const own = useCollection((s) => s.amiibo[ownershipId]) ?? EMPTY_AMIIBO_OWNERSHIP;
  const setFlag = useCollection((s) => s.setAmiiboFlag);
  const owned = boxed ? (own.cib || own.box || own.figure) : own.figure;

  const toggle = (value: boolean) => {
    setFlag(ownershipId, boxed ? "cib" : "figure", value);
    if (!value && boxed) {
      setFlag(ownershipId, "box", false);
      setFlag(ownershipId, "figure", false);
    }
  };

  return (
    <label htmlFor={ownershipId} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-card/50 p-3 transition-colors hover:border-primary/40", owned && "border-primary/50 bg-primary/5")}>
      <Checkbox id={ownershipId} checked={owned} onCheckedChange={(v) => toggle(v === true)} className="mt-0.5 shrink-0" />
      <Cover id={ownershipId} src={coverSrc ?? AMIIBO_COVERS[item.id]} alt={item.name} shape={boxed ? "box" : "square"} className={boxed ? "h-44 w-36 bg-white" : "h-28 w-28"} />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm leading-tight font-medium", owned && "text-muted-foreground")}>{item.name}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="text-xs tabular-nums text-muted-foreground">{item.year}</span>
          {item.pack && <Badge variant="outline" className="text-[10px] font-normal">{t("badge.multipack")}</Badge>}
          {item.variant && <Badge variant="outline" className="text-[10px] font-normal">{t("badge.variant")}</Badge>}
          {item.upcoming && <Badge variant="secondary" className="text-[10px] font-normal">{t("badge.upcoming")}</Badge>}
        </div>
        {item.notes && <p className="mt-2 text-xs text-muted-foreground">{item.notes}</p>}
      </div>
    </label>
  );
}
