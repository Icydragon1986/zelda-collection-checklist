import { readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve("public/images/library");
const dataFiles = [
  "src/data/covers.ts",
  "src/data/amiiboCovers.ts",
  "src/data/amiiboPackageCovers.ts",
  "src/data/specialConsoles.ts",
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]));
  return nested.flat();
}

const replacements = new Map();
const failures = [];
let before = 0;
let after = 0;
for (const file of await walk(root)) {
  const oldSize = (await stat(file)).size;
  before += oldSize;
  const output = file.replace(/\.[^.]+$/, ".webp");
  try {
    // Charger tout le fichier en mémoire libère immédiatement le handle source.
    // C'est nécessaire sous Windows pour pouvoir réécrire le même WebP ensuite.
    const source = await readFile(file);
    const image = sharp(source, { animated: false }).rotate();
    const metadata = await image.metadata();
    const maxDimension = 1800;
    const needsResize = (metadata.width ?? 0) > maxDimension || (metadata.height ?? 0) > maxDimension;
    if (path.extname(file).toLowerCase() === ".webp") {
      after += oldSize;
      const publicPath = `/${path.relative("public", file).split(path.sep).join("/")}`;
      replacements.set(publicPath, publicPath);
      continue;
    }
    const pipeline = needsResize ? image.resize({ width: maxDimension, height: maxDimension, fit: "inside", withoutEnlargement: true }) : image;
    const bytes = await pipeline.webp({ quality: 88, alphaQuality: 92, effort: 5, smartSubsample: true }).toBuffer();
    // `toBuffer` termine d'abord complètement la lecture. On peut ensuite
    // remplacer un WebP existant directement, ce qui évite l'erreur EPERM de
    // Windows provoquée par un renommage par-dessus un fichier existant.
    await writeFile(output, bytes);
    if (output !== file) await unlink(file);
    after += bytes.length;
    const oldPublic = `/${path.relative("public", file).split(path.sep).join("/")}`;
    const newPublic = `/${path.relative("public", output).split(path.sep).join("/")}`;
    replacements.set(oldPublic, newPublic);
  } catch (error) {
    after += oldSize;
    failures.push({ file, error: error instanceof Error ? error.message : String(error) });
  }
}

for (const file of dataFiles) {
  let text = await readFile(file, "utf8");
  for (const [from, to] of replacements) text = text.split(from).join(to);
  await writeFile(file, text);
}

console.log(JSON.stringify({ files: replacements.size + failures.length, before, after, savedPercent: Math.round((1 - after / before) * 1000) / 10, failures }, null, 2));
