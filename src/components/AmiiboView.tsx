import { AMIIBO } from "@/data/amiibo";
import { AMIIBO_PACKAGE_COVERS } from "@/data/amiiboPackageCovers";
import { groupAmiiboBySeries, normalize } from "@/lib/collection";
import { useFilters } from "@/store/useFilters";
import { AmiiboSeriesSection } from "@/components/AmiiboSeriesSection";
import type { Region } from "@/data/types";

export function AmiiboView({ region, boxed = false }: { region: Region; boxed?: boolean }) {
  const search = useFilters((s) => s.search);
  const query = normalize(search.trim());
  const regional = AMIIBO.filter((a) =>
    (!a.regions || a.regions.includes(region)) &&
    (boxed ? (!a.boxedRegions || a.boxedRegions.includes(region)) : !a.pack),
  );
  const filtered = query ? regional.filter((a) => normalize(a.name).includes(query) || normalize(a.series).includes(query)) : regional;
  const groups = groupAmiiboBySeries(filtered);

  if (groups.length === 0) return <p className="py-12 text-center text-sm text-muted-foreground">Aucun amiibo ne correspond à cette recherche.</p>;

  return (
    <div className="flex flex-col gap-3">
      {groups.map(([series, items]) => (
        <AmiiboSeriesSection key={series} series={series} items={items} region={region} boxed={boxed} covers={boxed ? AMIIBO_PACKAGE_COVERS : undefined} />
      ))}
    </div>
  );
}
