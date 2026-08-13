import { readdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
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
  const temporaryOutput = output === file ? `${file}.optimized` : output;
  try {
    const image = sharp(file, { animated: false }).rotate();
    const metadata = await image.metadata();
    const maxDimension = 1800;
    const needsResize = (metadata.width ?? 0) > maxDimension || (metadata.height ?? 0) > maxDimension;
    const pipeline = needsResize ? image.resize({ width: maxDimension, height: maxDimension, fit: "inside", withoutEnlargement: true }) : image;
    const bytes = await pipeline.webp({ quality: 88, alphaQuality: 92, effort: 5, smartSubsample: true }).toBuffer();
    await writeFile(temporaryOutput, bytes);
    if (temporaryOutput !== output) await rename(temporaryOutput, output);
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
