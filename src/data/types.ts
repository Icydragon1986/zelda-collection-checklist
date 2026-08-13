export type Region = "NA" | "PAL" | "JP";

export const REGION_LABELS: Record<Region, string> = {
  NA: "Amérique du Nord",
  PAL: "Europe / PAL",
  JP: "Japon",
};

export type ConsoleName =
  | "Famicom Disk System"
  | "Famicom"
  | "NES"
  | "Satellaview"
  | "SNES"
  | "Game Boy"
  | "Philips CD-i"
  | "Game Boy Color"
  | "Nintendo 64"
  | "Game Boy Advance"
  | "GameCube"
  | "Nintendo DS"
  | "Wii"
  | "Nintendo 3DS"
  | "Wii U"
  | "Nintendo Switch"
  | "Nintendo Switch 2";

// Ordre chronologique maître, toutes régions confondues.
export const CONSOLE_ORDER: ConsoleName[] = [
  "Famicom Disk System",
  "Famicom",
  "NES",
  "SNES",
  "Satellaview",
  "Game Boy",
  "Philips CD-i",
  "Game Boy Color",
  "Nintendo 64",
  "Game Boy Advance",
  "GameCube",
  "Nintendo DS",
  "Wii",
  "Nintendo 3DS",
  "Wii U",
  "Nintendo Switch",
  "Nintendo Switch 2",
];

export type GameCategory =
  | "main" // jeu Zelda principal
  | "spinoff" // Hyrule Warriors, Cadence of Hyrule, Tingle...
  | "compilation" // bonus de précommande, Collector's Edition (disque multi-jeux), Famicom Mini...
  | "edition" // édition collector/limitée d'un jeu déjà listé (steelbook, figurine, artbook...)
  | "broadcast" // BS Zelda (Satellaview) - pas un produit retail standard
  | "curiosity" // CD-i Philips, non-Nintendo
  | "upcoming"; // annoncé, pas encore sorti

export const CATEGORY_LABELS: Record<GameCategory, string> = {
  main: "Jeu principal",
  spinoff: "Dérivé",
  compilation: "Bonus / Compilation",
  edition: "Édition spéciale",
  broadcast: "Diffusion (Satellaview)",
  curiosity: "Curiosité (non-Nintendo)",
  upcoming: "À venir",
};

export interface Game {
  id: string;
  title: string;
  console: ConsoleName;
  region: Region;
  year: number;
  category: GameCategory;
  notes?: string;
}

export type AmiiboSeries =
  | "Super Smash Bros."
  | "30e anniversaire"
  | "Twilight Princess"
  | "Link à travers l'histoire"
  | "Breath of the Wild"
  | "Skyward Sword"
  | "Link's Awakening"
  | "Tears of the Kingdom";

export const AMIIBO_SERIES_ORDER: AmiiboSeries[] = [
  "Super Smash Bros.",
  "30e anniversaire",
  "Twilight Princess",
  "Link à travers l'histoire",
  "Breath of the Wild",
  "Skyward Sword",
  "Link's Awakening",
  "Tears of the Kingdom",
];

export interface Amiibo {
  id: string;
  name: string;
  series: AmiiboSeries;
  year: number;
  variant?: boolean;
  upcoming?: boolean;
  notes?: string;
  pack?: boolean;
  regions?: Region[];
  boxedRegions?: Region[];
}

export interface SpecialConsole {
  id: string;
  name: string;
  family: string;
  region: Region | "MONDE";
  year: number;
  notes?: string;
}
