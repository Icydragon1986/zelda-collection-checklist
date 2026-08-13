import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(projectRoot, "catalog", "catalog-additions.json");
const resourcesPath = join(projectRoot, "src-tauri", "resources");
const args = parseArgs(process.argv.slice(2));

if (args.help || !args.kind) {
  printHelp();
  process.exit(args.help ? 0 : 1);
}

const kind = required("kind");
if (!["game", "console", "amiibo"].includes(kind)) fail("--kind doit être game, console ou amiibo.");

const originalManifest = readFileSync(manifestPath, "utf8");
const manifest = JSON.parse(originalManifest);
const createdImages = [];

try {
  const id = required("id");
  validateId(id);
  validateUniqueId(id, manifest);

  if (kind === "game") await addGame(id, manifest.games);
  if (kind === "console") await addConsole(id, manifest.consoles);
  if (kind === "amiibo") await addAmiibo(id, manifest.amiibo);

  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  const audit = spawnSync(process.execPath, [join(projectRoot, "scripts", "audit-catalog.mjs")], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  if (audit.status !== 0) throw new Error(audit.stderr || audit.stdout || "L'audit du catalogue a échoué.");

  console.log(`\nAjout terminé : ${id}`);
  console.log(audit.stdout.trim());
} catch (error) {
  writeFileSync(manifestPath, originalManifest, "utf8");
  for (const image of createdImages) rmSync(image, { force: true });
  fail(error instanceof Error ? error.message : String(error));
}

async function addGame(id, list) {
  const region = validateRegion(required("region"));
  const category = required("category");
  if (!["main", "spinoff", "compilation", "edition", "broadcast", "curiosity", "upcoming"].includes(category)) {
    throw new Error("Catégorie de jeu invalide.");
  }
  const image = await importImage(required("image"), "games", id);
  list.push(compact({
    id,
    title: required("title"),
    console: required("console"),
    region,
    year: validateYear(required("year")),
    category,
    notes: args.notes,
    image,
  }));
}

async function addConsole(id, list) {
  const region = required("region");
  if (!["NA", "PAL", "JP", "MONDE"].includes(region)) throw new Error("Région de console invalide.");
  const image = await importImage(required("image"), "consoles", id);
  list.push(compact({
    id,
    name: required("name"),
    family: required("family"),
    region,
    year: validateYear(required("year")),
    notes: args.notes,
    image,
  }));
}

async function addAmiibo(id, list) {
  const figureImage = await importImage(required("image"), "amiibo-figures", id);
  const packageImages = {};
  for (const region of ["NA", "PAL", "JP"]) {
    const source = args[`boxed-${region.toLowerCase()}`];
    if (source) packageImages[region] = await importImage(source, "amiibo-packages", `${id}-${region.toLowerCase()}`);
  }
  const regions = parseRegions(args.regions);
  const boxedRegions = parseRegions(args["boxed-regions"]);
  list.push(compact({
    id,
    name: required("name"),
    series: required("series"),
    year: validateYear(required("year")),
    variant: Boolean(args.variant) || undefined,
    upcoming: Boolean(args.upcoming) || undefined,
    notes: args.notes,
    pack: Boolean(args.pack) || undefined,
    regions,
    boxedRegions,
    figureImage,
    packageImages: Object.keys(packageImages).length ? packageImages : undefined,
  }));
}

async function importImage(source, folder, name) {
  const destination = join(resourcesPath, "images", "catalog-additions", folder, `${name}.webp`);
  mkdirSync(dirname(destination), { recursive: true });
  if (existsSync(destination)) throw new Error(`L'image existe déjà : ${destination}`);

  let input = source;
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Téléchargement impossible (${response.status}) : ${source}`);
    input = Buffer.from(await response.arrayBuffer());
  } else {
    input = resolve(source);
    if (!existsSync(input)) throw new Error(`Image introuvable : ${input}`);
    if (!extname(input)) throw new Error(`Le fichier image n'a pas d'extension : ${input}`);
  }

  await sharp(input)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90, alphaQuality: 95 })
    .toFile(destination);
  createdImages.push(destination);
  return `/${destination.slice(resourcesPath.length + 1).replaceAll("\\", "/")}`;
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const token = values[index];
    if (!token.startsWith("--")) fail(`Argument inattendu : ${token}`);
    const key = token.slice(2);
    const next = values[index + 1];
    if (!next || next.startsWith("--")) parsed[key] = true;
    else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function required(key) {
  const value = args[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(`Argument requis manquant : --${key}`);
  return value.trim();
}

function validateId(id) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error("--id doit contenir seulement des minuscules, chiffres et tirets.");
}

function validateUniqueId(id, manifest) {
  const sourceFiles = ["games.ts", "specialConsoles.ts", "amiibo.ts"]
    .map((file) => readFileSync(join(projectRoot, "src", "data", file), "utf8"))
    .join("\n");
  const existing = new Set([
    ...[...sourceFiles.matchAll(/\bid:\s*"([^"]+)"/g)].map((match) => match[1]),
    ...manifest.games.map((item) => item.id),
    ...manifest.consoles.map((item) => item.id),
    ...manifest.amiibo.map((item) => item.id),
  ]);
  if (existing.has(id)) throw new Error(`Identifiant déjà utilisé : ${id}`);
}

function validateRegion(region) {
  if (!["NA", "PAL", "JP"].includes(region)) throw new Error("Région invalide; utilisez NA, PAL ou JP.");
  return region;
}

function validateYear(value) {
  const year = Number(value);
  if (!Number.isInteger(year) || year < 1980 || year > 2100) throw new Error("Année invalide.");
  return year;
}

function parseRegions(value) {
  if (!value) return undefined;
  const regions = String(value).split(",").map((region) => validateRegion(region.trim()));
  return regions.length ? regions : undefined;
}

function compact(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}

function fail(message) {
  console.error(`Erreur : ${message}`);
  process.exit(1);
}

function printHelp() {
  console.log(`Ajout rapide au catalogue Zelda\n

Jeu :
  npm run catalog:add -- --kind game --id ID --title TITRE --console CONSOLE --region NA|PAL|JP --year ANNÉE --category CATÉGORIE --image FICHIER_OU_URL [--notes TEXTE]

Console :
  npm run catalog:add -- --kind console --id ID --name NOM --family FAMILLE --region NA|PAL|JP|MONDE --year ANNÉE --image FICHIER_OU_URL [--notes TEXTE]

Amiibo :
  npm run catalog:add -- --kind amiibo --id ID --name NOM --series SÉRIE --year ANNÉE --image FIGURINE [--boxed-na IMAGE] [--boxed-pal IMAGE] [--boxed-jp IMAGE] [--variant] [--upcoming] [--pack] [--regions NA,PAL,JP] [--boxed-regions NA,PAL,JP] [--notes TEXTE]

L'image peut être un chemin local ou une URL HTTPS. Elle est convertie en WebP, classée et vérifiée automatiquement.`);
}
