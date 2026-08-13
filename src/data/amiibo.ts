import type { Amiibo } from "./types";
import { ADDITIONAL_AMIIBO } from "./catalogAdditions";

const BASE_AMIIBO: Amiibo[] = [
  // Super Smash Bros.
  { id: "amiibo-smash-link", name: "Link", series: "Super Smash Bros.", year: 2014 },
  { id: "amiibo-smash-zelda", name: "Zelda", series: "Super Smash Bros.", year: 2014 },
  { id: "amiibo-smash-sheik", name: "Sheik", series: "Super Smash Bros.", year: 2015 },
  { id: "amiibo-smash-toon-link", name: "Toon Link", series: "Super Smash Bros.", year: 2015 },
  { id: "amiibo-smash-ganondorf", name: "Ganondorf", series: "Super Smash Bros.", year: 2015 },
  { id: "amiibo-smash-young-link", name: "Young Link", series: "Super Smash Bros.", year: 2019 },

  // 30e anniversaire (tous sortis le 2 décembre 2016)
  { id: "amiibo-30th-link-8bit", name: "Link (The Legend of Zelda, 8-bit)", series: "30e anniversaire", year: 2016, variant: true },
  { id: "amiibo-30th-link-oot", name: "Link (Ocarina of Time)", series: "30e anniversaire", year: 2016, variant: true },
  { id: "amiibo-30th-toon-link-ww", name: "Toon Link (The Wind Waker)", series: "30e anniversaire", year: 2016, variant: true, notes: "Sert aussi de figure de compatibilité pour Wind Waker HD." },
  { id: "amiibo-30th-toon-zelda", name: "Zelda (The Wind Waker)", series: "30e anniversaire", year: 2016, variant: true, boxedRegions: ["PAL", "JP"] },
  { id: "amiibo-pack-30th-toon-na", name: "Pack 2 amiibo – Toon Link & Zelda (The Wind Waker)", series: "30e anniversaire", year: 2016, pack: true, regions: ["NA"], notes: "Emballage double nord-américain officiel." },
  { id: "amiibo-pack-30th-toon-pal", name: "Pack 2 amiibo – Toon Link & Zelda (The Wind Waker)", series: "30e anniversaire", year: 2016, pack: true, regions: ["PAL"], notes: "Emballage double européen officiel." },

  // Twilight Princess
  { id: "amiibo-tp-wolf-link", name: "Wolf Link", series: "Twilight Princess", year: 2016, notes: "Sorti avec Twilight Princess HD." },

  // Vague "Historical Link" (23 juin 2017)
  { id: "amiibo-hist-link-mm", name: "Link (Majora's Mask)", series: "Link à travers l'histoire", year: 2017, variant: true },
  { id: "amiibo-hist-link-ss", name: "Link (Skyward Sword)", series: "Link à travers l'histoire", year: 2017, variant: true },
  { id: "amiibo-hist-link-tp", name: "Link (Twilight Princess)", series: "Link à travers l'histoire", year: 2017, variant: true, notes: "Exclusivité GameStop aux États-Unis." },

  // Breath of the Wild — vague 1 (3 mars 2017)
  { id: "amiibo-botw-link-archer", name: "Link (Archer)", series: "Breath of the Wild", year: 2017, variant: true },
  { id: "amiibo-botw-link-rider", name: "Link (Rider)", series: "Breath of the Wild", year: 2017, variant: true },
  { id: "amiibo-botw-zelda", name: "Zelda", series: "Breath of the Wild", year: 2017 },
  { id: "amiibo-botw-guardian", name: "Guardian", series: "Breath of the Wild", year: 2017 },
  { id: "amiibo-botw-bokoblin", name: "Bokoblin", series: "Breath of the Wild", year: 2017 },
  // Breath of the Wild — vague 2, les Prodiges (10 novembre 2017)
  { id: "amiibo-botw-mipha", name: "Mipha", series: "Breath of the Wild", year: 2017, boxedRegions: ["NA", "JP"] },
  { id: "amiibo-botw-daruk", name: "Daruk", series: "Breath of the Wild", year: 2017, boxedRegions: ["NA", "JP"] },
  { id: "amiibo-botw-revali", name: "Revali", series: "Breath of the Wild", year: 2017, boxedRegions: ["NA", "JP"] },
  { id: "amiibo-botw-urbosa", name: "Urbosa", series: "Breath of the Wild", year: 2017, boxedRegions: ["NA", "JP"] },
  { id: "amiibo-pack-champions-pal", name: "Pack 4 amiibo – Les quatre Prodiges", series: "Breath of the Wild", year: 2017, pack: true, regions: ["PAL"], notes: "Mipha, Daruk, Revali et Urbosa dans un emballage commun PAL." },
  { id: "amiibo-pack-champions-jp", name: "Pack 4 amiibo – Les quatre Prodiges", series: "Breath of the Wild", year: 2017, pack: true, regions: ["JP"], notes: "My Nintendo Store japonais; emballage distinct de l'édition PAL." },

  // Skyward Sword
  { id: "amiibo-ss-zelda-loftwing", name: "Zelda & Loftwing", series: "Skyward Sword", year: 2021, notes: "Sorti avec Skyward Sword HD." },

  // Link's Awakening
  { id: "amiibo-la-link", name: "Link (Link's Awakening)", series: "Link's Awakening", year: 2019 },

  // Tears of the Kingdom — vague 1
  { id: "amiibo-totk-link", name: "Link", series: "Tears of the Kingdom", year: 2023, notes: "Sorti le jour du lancement du jeu." },
  { id: "amiibo-totk-zelda", name: "Zelda", series: "Tears of the Kingdom", year: 2023 },
  { id: "amiibo-totk-ganondorf", name: "Ganondorf", series: "Tears of the Kingdom", year: 2023 },
  // Tears of the Kingdom — vague 2 (5 juin 2025, lancement Switch 2)
  { id: "amiibo-totk-tulin", name: "Tulin", series: "Tears of the Kingdom", year: 2025 },
  { id: "amiibo-totk-yunobo", name: "Yunobo", series: "Tears of the Kingdom", year: 2025 },
  { id: "amiibo-totk-sidon", name: "Sidon", series: "Tears of the Kingdom", year: 2025 },
  { id: "amiibo-totk-riju", name: "Riju", series: "Tears of the Kingdom", year: 2025 },
  // Tears of the Kingdom — vague 3
  { id: "amiibo-totk-mineru", name: "Mineru's Construct", series: "Tears of the Kingdom", year: 2026, upcoming: true, notes: "Annoncé pour le 17 septembre 2026 — pas encore sorti." },
];

export const AMIIBO: Amiibo[] = [...BASE_AMIIBO, ...ADDITIONAL_AMIIBO];
