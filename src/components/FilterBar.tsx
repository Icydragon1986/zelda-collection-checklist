import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useFilters, type OptionalCategory, type OwnershipFilter } from "@/store/useFilters";
import { useI18n } from "@/i18n";

const CATEGORY_TOGGLES: OptionalCategory[] = ["spinoff", "compilation", "edition", "broadcast", "curiosity"];

export function FilterBar() {
  const { t } = useI18n();
  const search = useFilters((s) => s.search);
  const setSearch = useFilters((s) => s.setSearch);
  const ownership = useFilters((s) => s.ownership);
  const setOwnership = useFilters((s) => s.setOwnership);
  const categories = useFilters((s) => s.categories);
  const toggleCategory = useFilters((s) => s.toggleCategory);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("filters.search")}
          className="pl-8"
        />
      </div>
      <select value={ownership} onChange={(event) => setOwnership(event.target.value as OwnershipFilter)} className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30">
        <option value="all">{t("filters.all")}</option>
        <option value="owned">{t("filters.owned")}</option>
        <option value="missing">{t("filters.missing")}</option>
        <option value="cib">{t("filters.cib")}</option>
        <option value="incomplete">{t("filters.incomplete")}</option>
      </select>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {CATEGORY_TOGGLES.map((key) => (
          <label key={key} className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch
              size="sm"
              checked={categories[key]}
              onCheckedChange={() => toggleCategory(key)}
            />
            {t(`filters.${key}`)}
          </label>
        ))}
      </div>
    </div>
  );
}
