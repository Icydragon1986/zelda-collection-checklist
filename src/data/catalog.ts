import { AMIIBO } from "./amiibo";
import { AMIIBO_PACKAGE_COVERS } from "./amiiboPackageCovers";
import { GAMES } from "./games";
import { SPECIAL_CONSOLES } from "./specialConsoles";
import type { Region } from "./types";

export const REGIONS: Region[] = ["NA", "PAL", "JP"];

export interface MissingVisual {
  id: string;
  label: string;
  region: Region;
  reason: string;
}

export const MISSING_VISUALS: MissingVisual[] = [];

export function boxedAmiibo(region: Region) {
  return AMIIBO.filter((item) =>
    (!item.regions || item.regions.includes(region)) &&
    (!item.boxedRegions || item.boxedRegions.includes(region)) &&
    Object.prototype.hasOwnProperty.call(AMIIBO_PACKAGE_COVERS, `${item.id}-${region}`),
  );
}

export function validateCatalog(): string[] {
  const errors: string[] = [];
  const ids = [...GAMES.map((x) => x.id), ...SPECIAL_CONSOLES.map((x) => x.id), ...AMIIBO.map((x) => x.id)];
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) errors.push(`Identifiants en double: ${[...new Set(duplicates)].join(", ")}`);
  for (const item of GAMES) if (!REGIONS.includes(item.region)) errors.push(`Région invalide: ${item.id}`);
  return errors;
}
