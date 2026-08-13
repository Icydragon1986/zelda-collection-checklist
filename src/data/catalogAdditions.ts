import additions from "../../catalog/catalog-additions.json";
import type { Amiibo, Game, Region, SpecialConsole } from "./types";

type GameAddition = Game & { image: string };
type ConsoleAddition = SpecialConsole & { image: string };
type AmiiboAddition = Amiibo & {
  figureImage: string;
  packageImages?: Partial<Record<Region, string>>;
};

const games = additions.games as GameAddition[];
const consoles = additions.consoles as ConsoleAddition[];
const amiibo = additions.amiibo as AmiiboAddition[];

export const ADDITIONAL_GAMES: Game[] = games.map(({ image: _image, ...item }) => item);
export const ADDITIONAL_SPECIAL_CONSOLES: SpecialConsole[] = consoles.map(({ image: _image, ...item }) => item);
export const ADDITIONAL_AMIIBO: Amiibo[] = amiibo.map(({ figureImage: _figureImage, packageImages: _packageImages, ...item }) => item);

export const ADDITIONAL_GAME_COVERS = Object.fromEntries(games.map((item) => [item.id, item.image]));
export const ADDITIONAL_CONSOLE_COVERS = Object.fromEntries(consoles.map((item) => [item.id, item.image]));
export const ADDITIONAL_AMIIBO_COVERS = Object.fromEntries(amiibo.map((item) => [item.id, item.figureImage]));
export const ADDITIONAL_AMIIBO_PACKAGE_COVERS = Object.fromEntries(
  amiibo.flatMap((item) =>
    Object.entries(item.packageImages ?? {}).map(([region, image]) => [`${item.id}-${region}`, image]),
  ),
);
