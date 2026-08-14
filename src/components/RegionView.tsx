import { GAMES } from "@/data/games";
import { filterGames, groupGamesByConsole } from "@/lib/collection";
import { useFilters } from "@/store/useFilters";
import { useCollection } from "@/store/useCollection";
import { ConsoleSection } from "@/components/ConsoleSection";
import type { Region } from "@/data/types";
import { useI18n } from "@/i18n";

export function RegionView({ region }: { region: Region }) {
  const { t } = useI18n();
  const search = useFilters((s) => s.search);
  const ownership = useFilters((s) => s.ownership);
  const ownedGames = useCollection((s) => s.games);
  // Subscribe to `categories` too: `isCategoryVisible` is a stable function
  // reference, so selecting it alone would never trigger a re-render on toggle.
  useFilters((s) => s.categories);
  const isCategoryVisible = useFilters((s) => s.isCategoryVisible);

  const regionGames = GAMES.filter((g) => g.region === region);
  const filtered = filterGames(regionGames, search, isCategoryVisible).filter((game) => {
    const own = ownedGames[game.id];
    const any = !!own && (own.cartridge || own.manual || own.box || own.cib);
    if (ownership === "owned") return any;
    if (ownership === "missing") return !any;
    if (ownership === "cib") return !!own?.cib;
    if (ownership === "incomplete") return any && !own?.cib;
    return true;
  });
  const groups = groupGamesByConsole(filtered);

  if (groups.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        {t("empty.games")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map(([consoleName, games]) => (
        <ConsoleSection key={consoleName} console={consoleName} games={games} />
      ))}
    </div>
  );
}
