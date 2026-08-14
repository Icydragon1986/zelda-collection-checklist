import { CollapsibleGroup } from "@/components/CollapsibleGroup";
import { AmiiboCard } from "@/components/AmiiboCard";
import { countOwned } from "@/lib/collection";
import { useCollection } from "@/store/useCollection";
import type { Amiibo, AmiiboSeries, Region } from "@/data/types";
import { seriesLabel, useI18n } from "@/i18n";

export function AmiiboSeriesSection({ series, items, region, boxed = false, covers }: { series: AmiiboSeries; items: Amiibo[]; region: Region; boxed?: boolean; covers?: Record<string, string> }) {
  const { language } = useI18n();
  useCollection((s) => s.amiibo);
  const isAmiiboOwned = useCollection((s) => s.isAmiiboOwned);
  const ownedCount = countOwned(
    items.map((i) => `${boxed ? "boxed-" : ""}${i.id}-${region}`),
    isAmiiboOwned,
  );

  return (
    <CollapsibleGroup title={seriesLabel(series, language)} ownedCount={ownedCount} total={items.length}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <AmiiboCard key={item.id} item={item} ownershipId={`${boxed ? "boxed-" : ""}${item.id}-${region}`} coverSrc={covers?.[`${item.id}-${region}`] ?? covers?.[item.id]} boxed={boxed} />
        ))}
      </div>
    </CollapsibleGroup>
  );
}
