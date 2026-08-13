import { CollapsibleGroup } from "@/components/CollapsibleGroup";
import { GameRow } from "@/components/GameRow";
import { countOwned } from "@/lib/collection";
import { useCollection } from "@/store/useCollection";
import type { ConsoleName, Game } from "@/data/types";

export function ConsoleSection({ console: consoleName, games }: { console: ConsoleName; games: Game[] }) {
  // Subscribing to `games` (not just `isGameOwned`) forces a re-render when ownership changes.
  useCollection((s) => s.games);
  const isGameOwned = useCollection((s) => s.isGameOwned);
  const ownedCount = countOwned(
    games.map((g) => g.id),
    isGameOwned,
  );

  return (
    <CollapsibleGroup title={consoleName} ownedCount={ownedCount} total={games.length}>
      <div className="flex flex-col gap-1.5">
        {games.map((game) => (
          <GameRow key={game.id} game={game} />
        ))}
      </div>
    </CollapsibleGroup>
  );
}
