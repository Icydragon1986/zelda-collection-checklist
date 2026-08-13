import { GAMES } from "@/data/games";
import { filterGames, groupGamesByConsole } from "@/lib/collection";
import { useFilters } from "@/store/useFilters";
import { ConsoleSection } from "@/components/ConsoleSection";
import type { Region } from "@/data/types";

export function RegionView({ region }: { region: Region }) {
  const search = useFilters((s) => s.search);
  // Subscribe to `categories` too: `isCategoryVisible` is a stable function
  // reference, so selecting it alone would never trigger a re-render on toggle.
  useFilters((s) => s.categories);
  const isCategoryVisible = useFilters((s) => s.isCategoryVisible);

  const regionGames = GAMES.filter((g) => g.region === region);
  const filtered = filterGames(regionGames, search, isCategoryVisible);
  const groups = groupGamesByConsole(filtered);

  if (groups.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Aucun jeu ne correspond à ces filtres.
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
