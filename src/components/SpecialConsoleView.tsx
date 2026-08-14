import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Cover } from "@/components/Cover";
import { SPECIAL_CONSOLES, SPECIAL_CONSOLE_COVERS } from "@/data/specialConsoles";
import { useCollection } from "@/store/useCollection";
import { useFilters } from "@/store/useFilters";
import { normalize } from "@/lib/collection";
import { cn } from "@/lib/utils";
import type { Region } from "@/data/types";

export function SpecialConsoleView({ region }: { region: Region }) {
  const query = normalize(useFilters((s) => s.search).trim());
  const ownership = useFilters((s) => s.ownership);
  const consoles = useCollection((s) => s.consoles);
  const toggle = useCollection((s) => s.toggleConsole);
  const regional = SPECIAL_CONSOLES.filter((c) => c.region === region);
  const searched = query ? regional.filter((c) => normalize(`${c.name} ${c.family} ${c.region}`).includes(query)) : regional;
  const items = searched.filter((item) => {
    const owned = !!consoles[`${item.id}-${region}`];
    if (ownership === "owned" || ownership === "cib") return owned;
    if (ownership === "missing") return !owned;
    if (ownership === "incomplete") return false;
    return true;
  });

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const ownershipId = `${item.id}-${region}`;
        const owned = !!consoles[ownershipId];
        return (
          <label key={item.id} htmlFor={ownershipId} className={cn("flex cursor-pointer gap-3 rounded-xl border border-border/60 bg-card/50 p-3 hover:border-primary/40", owned && "border-primary/50 bg-primary/5")}>
            <Checkbox id={ownershipId} checked={owned} onCheckedChange={() => toggle(ownershipId)} className="mt-0.5" />
            <Cover id={item.id} src={SPECIAL_CONSOLE_COVERS[item.id]} alt={item.name} shape="square" className="h-24 w-24 sm:h-32 sm:w-32" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight">{item.name}</p>
              <div className="mt-2 flex flex-wrap gap-1.5"><Badge variant="outline">{item.family}</Badge><Badge variant="secondary">{item.region}</Badge><span className="text-xs text-muted-foreground">{item.year}</span></div>
              {item.notes && <p className="mt-2 text-xs text-muted-foreground">{item.notes}</p>}
            </div>
          </label>
        );
      })}
    </div>
  );
}
