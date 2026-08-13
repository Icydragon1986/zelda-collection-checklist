import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(projectRoot, "src");
const resourceRoot = join(projectRoot, "src-tauri", "resources");
const imageRoot = join(resourceRoot, "images");

const read = (path) => readFileSync(join(projectRoot, path), "utf8");
const errors = [];
const additions = JSON.parse(read("catalog/catalog-additions.json"));
const addedGames = additions.games ?? [];
const addedConsoles = additions.consoles ?? [];
const addedAmiibo = additions.amiibo ?? [];

function matches(source, expression, group = 1) {
  return [...source.matchAll(expression)].map((match) => match[group]);
}

function duplicates(values) {
  return [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
}

function objectKeys(path, objectName) {
  const source = read(path);
  const object = source.match(new RegExp(`(?:export\\s+)?const\\s+${objectName}[^=]*=\\s*\\{([\\s\\S]*?)\\n\\};`));
  return object ? matches(object[1], /^\s*"([^"]+)"\s*:/gm) : [];
}

function walk(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    return entry.isDirectory() ? walk(child) : [child];
  });
}

const packageVersion = JSON.parse(read("package.json")).version;
const tauriVersion = JSON.parse(read("src-tauri/tauri.conf.json")).version;
const cargoVersion = read("src-tauri/Cargo.toml").match(/^version\s*=\s*"([^"]+)"/m)?.[1];
if (!packageVersion || packageVersion !== tauriVersion || packageVersion !== cargoVersion) {
  errors.push(`Versions désynchronisées: npm=${packageVersion ?? "?"}, Tauri=${tauriVersion ?? "?"}, Cargo=${cargoVersion ?? "?"}`);
}

const catalogSources = ["src/data/games.ts", "src/data/specialConsoles.ts", "src/data/amiibo.ts"];
const catalogIds = [
  ...catalogSources.flatMap((path) => matches(read(path), /\bid:\s*"([^"]+)"/g)),
  ...addedGames.map((item) => item.id),
  ...addedConsoles.map((item) => item.id),
  ...addedAmiibo.map((item) => item.id),
];
const duplicateIds = duplicates(catalogIds);
if (duplicateIds.length) errors.push(`Identifiants en double: ${duplicateIds.join(", ")}`);

for (const [path, objectName] of [
  ["src/data/covers.ts", "EDITION_COVERS"],
  ["src/data/covers.ts", "GAME_COVERS"],
  ["src/data/specialConsoles.ts", "SPECIAL_CONSOLE_COVERS"],
  ["src/data/amiiboCovers.ts", "AMIIBO_COVERS"],
  ["src/data/amiiboPackageCovers.ts", "AMIIBO_PACKAGE_COVERS"],
]) {
  const duplicateKeys = duplicates(objectKeys(path, objectName));
  if (duplicateKeys.length) errors.push(`Clés en double dans ${objectName}: ${duplicateKeys.join(", ")}`);
}

const allowedRegions = new Set(["NA", "PAL", "JP"]);
const gameRegions = [...matches(read("src/data/games.ts"), /\bregion:\s*"([^"]+)"/g), ...addedGames.map((item) => item.region)];
const invalidGameRegions = [...new Set(gameRegions.filter((region) => !allowedRegions.has(region)))];
if (invalidGameRegions.length) errors.push(`Régions de jeu invalides: ${invalidGameRegions.join(", ")}`);

const consoleRegions = [...matches(read("src/data/specialConsoles.ts"), /\bregion:\s*"([^"]+)"/g), ...addedConsoles.map((item) => item.region)];
const invalidConsoleRegions = [...new Set(consoleRegions.filter((region) => !allowedRegions.has(region) && region !== "MONDE"))];
if (invalidConsoleRegions.length) errors.push(`Régions de console invalides: ${invalidConsoleRegions.join(", ")}`);

const amiiboRegionLists = matches(read("src/data/amiibo.ts"), /\b(?:regions|boxedRegions):\s*\[([^\]]*)\]/g);
const amiiboRegions = [
  ...amiiboRegionLists.flatMap((list) => matches(list, /"([^"]+)"/g)),
  ...addedAmiibo.flatMap((item) => [...(item.regions ?? []), ...(item.boxedRegions ?? []), ...Object.keys(item.packageImages ?? {})]),
];
const invalidAmiiboRegions = [...new Set(amiiboRegions.filter((region) => !allowedRegions.has(region)))];
if (invalidAmiiboRegions.length) errors.push(`Régions d'amiibo invalides: ${invalidAmiiboRegions.join(", ")}`);

const coverKeys = (path) => new Set(matches(read(path), /"([^"]+)":\s*(?:"\/images\/|PRODUCT_PHOTO\.)/g));
const gameIds = [...matches(read("src/data/games.ts"), /\bid:\s*"([^"]+)"/g), ...addedGames.map((item) => item.id)];
const consoleIds = [...matches(read("src/data/specialConsoles.ts"), /\bid:\s*"([^"]+)"/g), ...addedConsoles.map((item) => item.id)];
const amiiboIds = [...matches(read("src/data/amiibo.ts"), /\bid:\s*"([^"]+)"/g), ...addedAmiibo.map((item) => item.id)];
const gameCoverKeys = coverKeys("src/data/covers.ts");
const consoleCoverKeys = coverKeys("src/data/specialConsoles.ts");
const amiiboCoverKeys = coverKeys("src/data/amiiboCovers.ts");
for (const item of addedGames) if (item.image) gameCoverKeys.add(item.id);
for (const item of addedConsoles) if (item.image) consoleCoverKeys.add(item.id);
for (const item of addedAmiibo) if (item.figureImage) amiiboCoverKeys.add(item.id);

const missingGameCovers = gameIds.filter((id) => !gameCoverKeys.has(id));
const missingConsoleCovers = consoleIds.filter((id) => !consoleCoverKeys.has(id));
const missingAmiiboFigures = amiiboIds.filter((id) => !amiiboCoverKeys.has(id));
if (missingGameCovers.length) errors.push(`Jeux sans jaquette: ${missingGameCovers.join(", ")}`);
if (missingConsoleCovers.length) errors.push(`Consoles sans image: ${missingConsoleCovers.join(", ")}`);
if (missingAmiiboFigures.length) errors.push(`Amiibo sans photo individuelle: ${missingAmiiboFigures.join(", ")}`);

const sourceFiles = walk(sourceRoot).filter((path) => /\.(?:ts|tsx)$/.test(path));
const referencedImages = new Set([
  ...sourceFiles.flatMap((path) => matches(readFileSync(path, "utf8"), /["'](\/images\/[^"']+)["']/g)),
  ...matches(JSON.stringify(additions), /"(\/images\/[^"']+)"/g),
]);
const missingImages = [...referencedImages].filter((asset) => !existsSync(join(resourceRoot, asset.replace(/^\//, "").split("/").join(sep))));
if (missingImages.length) errors.push(`Fichiers d'image absents: ${missingImages.join(", ")}`);

const resourceImages = walk(imageRoot)
  .filter((path) => statSync(path).isFile())
  .map((path) => `/${relative(resourceRoot, path).split(sep).join("/")}`);
const unusedImages = resourceImages.filter((asset) => !referencedImages.has(asset));
if (unusedImages.length) errors.push(`Images locales inutilisées: ${unusedImages.join(", ")}`);

const headerLogo = join(projectRoot, "public", "triforce-checklist-logo.png");
if (!existsSync(headerLogo)) errors.push("Logo d'en-tête absent: public/triforce-checklist-logo.png");

const catalogPolicy = join(projectRoot, "docs", "catalog-audit.md");
if (!existsSync(catalogPolicy)) errors.push("Politique du catalogue absente: docs/catalog-audit.md");

if (errors.length) {
  console.error("Échec de l'audit du catalogue:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Version ${packageVersion} valide: ${gameIds.length} jeux, ${consoleIds.length} consoles, ${amiiboIds.length} amiibo et ${resourceImages.length} images locales.`);
}
