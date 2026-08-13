import { AMIIBO_SERIES_ORDER, CONSOLE_ORDER, type Amiibo, type AmiiboSeries, type ConsoleName, type Game } from "@/data/types";

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function filterGames(
  games: Game[],
  search: string,
  isCategoryVisible: (category: Game["category"]) => boolean,
): Game[] {
  const query = normalize(search.trim());
  return games.filter((game) => {
    if (!isCategoryVisible(game.category)) return false;
    if (!query) return true;
    return normalize(game.title).includes(query) || normalize(game.console).includes(query);
  });
}

export function groupGamesByConsole(games: Game[]): [ConsoleName, Game[]][] {
  const groups = new Map<ConsoleName, Game[]>();
  for (const game of games) {
    const list = groups.get(game.console) ?? [];
    list.push(game);
    groups.set(game.console, list);
  }
  return CONSOLE_ORDER.filter((name) => groups.has(name)).map((name) => [name, groups.get(name)!]);
}

export function groupAmiiboBySeries(items: Amiibo[]): [AmiiboSeries, Amiibo[]][] {
  const groups = new Map<AmiiboSeries, Amiibo[]>();
  for (const item of items) {
    const list = groups.get(item.series) ?? [];
    list.push(item);
    groups.set(item.series, list);
  }
  return AMIIBO_SERIES_ORDER.filter((name) => groups.has(name)).map((name) => [name, groups.get(name)!]);
}

export function countOwned(ids: string[], isOwned: (id: string) => boolean): number {
  return ids.reduce((total, id) => total + (isOwned(id) ? 1 : 0), 0);
}
