import { AMIIBO } from "@/data/amiibo";
import { AMIIBO_PACKAGE_COVERS, hasRegionalAmiiboPackageCover } from "@/data/amiiboPackageCovers";
import { groupAmiiboBySeries, normalize } from "@/lib/collection";
import { useFilters } from "@/store/useFilters";
import { useCollection } from "@/store/useCollection";
import { AmiiboSeriesSection } from "@/components/AmiiboSeriesSection";
import type { Region } from "@/data/types";
import { useI18n } from "@/i18n";

export function AmiiboView({ region, boxed = false }: { region: Region; boxed?: boolean }) {
  const { t } = useI18n();
  const search = useFilters((s) => s.search);
  const ownership = useFilters((s) => s.ownership);
  const ownedAmiibo = useCollection((s) => s.amiibo);
  const query = normalize(search.trim());
  const regional = AMIIBO.filter((a) =>
    (!a.regions || a.regions.includes(region)) &&
    (boxed
      ? (!a.boxedRegions || a.boxedRegions.includes(region)) && hasRegionalAmiiboPackageCover(a.id, region)
      : !a.pack),
  );
  const searched = query ? regional.filter((a) => normalize(a.name).includes(query) || normalize(a.series).includes(query)) : regional;
  const filtered = searched.filter((item) => {
    const own = ownedAmiibo[`${boxed ? "boxed-" : ""}${item.id}-${region}`];
    const owned = boxed ? !!own && (own.cib || own.box || own.figure) : !!own?.figure;
    if (ownership === "owned") return owned;
    if (ownership === "missing") return !owned;
    if (ownership === "cib") return boxed ? !!own?.cib : owned;
    if (ownership === "incomplete") return boxed ? owned && !own?.cib : false;
    return true;
  });
  const groups = groupAmiiboBySeries(filtered);

  if (groups.length === 0) return <p className="py-12 text-center text-sm text-muted-foreground">{t("empty.amiibo")}</p>;

  return (
    <div className="flex flex-col gap-3">
      {groups.map(([series, items]) => (
        <AmiiboSeriesSection key={series} series={series} items={items} region={region} boxed={boxed} covers={boxed ? AMIIBO_PACKAGE_COVERS : undefined} />
      ))}
    </div>
  );
}
