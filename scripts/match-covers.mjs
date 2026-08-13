import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { GAMES } from "../src/data/games.ts";

const REPO_BY_CONSOLE = {
  "Famicom Disk System": "Nintendo_-_Family_Computer_Disk_System",
  "NES": "Nintendo_-_Nintendo_Entertainment_System",
  "Satellaview": "Nintendo_-_Satellaview",
  "SNES": "Nintendo_-_Super_Nintendo_Entertainment_System",
  "Game Boy": "Nintendo_-_Game_Boy",
  "Game Boy Color": "Nintendo_-_Game_Boy_Color",
  "Nintendo 64": "Nintendo_-_Nintendo_64",
  "Game Boy Advance": "Nintendo_-_Game_Boy_Advance",
  "GameCube": "Nintendo_-_GameCube",
  "Nintendo DS": "Nintendo_-_Nintendo_DS",
  "Wii": "Nintendo_-_Wii",
  "Nintendo 3DS": "Nintendo_-_Nintendo_3DS",
  "Wii U": "Nintendo_-_Wii_U",
};

const REGION_TAG = { NA: "USA", PAL: "Europe", JP: "Japan" };

function normalize(str) {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ") // "&" and "/" become separators, matching filenames using "_" for "&"
    .replace(/\bthe\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchTree(repo) {
  const cacheDir = "./cache";
  if (!existsSync(cacheDir)) mkdirSync(cacheDir);
  const cacheFile = `${cacheDir}/${repo}.json`;
  if (existsSync(cacheFile)) {
    return JSON.parse(await import("node:fs").then((fs) => fs.promises.readFile(cacheFile, "utf-8")));
  }
  const res = await fetch(`https://api.github.com/repos/libretro-thumbnails/${repo}/git/trees/master?recursive=1`);
  if (!res.ok) {
    console.error(`FAILED tree fetch ${repo}: ${res.status}`);
    return [];
  }
  const json = await res.json();
  const paths = (json.tree || [])
    .map((e) => e.path)
    .filter((p) => p.startsWith("Named_Boxarts/") && p.endsWith(".png"));
  writeFileSync(cacheFile, JSON.stringify(paths));
  return paths;
}

function baseTitleAndTags(filename) {
  const name = filename.replace("Named_Boxarts/", "").replace(/\.png$/, "");
  const tags = [...name.matchAll(/\(([^)]*)\)/g)].map((m) => m[1]);
  const base = name.replace(/\s*\([^)]*\)/g, "").replace(/\s*\[[^\]]*\]/g, "").trim();
  return { path: filename, base, norm: normalize(base), tags, full: name };
}

// Bare series names are too generic to use as a matching query on their own
// (they'd match every "Zelda no Densetsu - X" entry in a console's repo).
const GENERIC = new Set([
  normalize("Zelda no Densetsu"),
  normalize("The Legend of Zelda"),
  normalize("Zelda"),
]);

function queryVariants(title) {
  const primary = normalize(title);
  const derived = [];
  if (title.includes(":")) {
    derived.push(title.split(":").slice(1).join(":").trim()); // after colon (subtitle)
    derived.push(title.split(":")[0].trim()); // before colon
  }
  if (title.includes(" - ")) derived.push(title.split(" - ").pop().trim());
  if (title.includes(" – ")) derived.push(title.split(" – ").pop().trim());
  if (title.includes("/")) derived.push(title.split("/")[0].trim());

  const normalizedDerived = derived.map(normalize).filter((v) => v.length > 2 && !GENERIC.has(v));
  return [...new Set([primary, ...normalizedDerived])].filter((v) => v.length > 2);
}

// Minimum length for a candidate's normalized base name to be trusted as a
// substring match in either direction — short bases (e.g. "n", "up") would
// otherwise trivially match almost any query.
const MIN_MATCH_LEN = 6;

const BAD_TAG = /\b(h|hack|beta|proto|demo|translation|tr|unl|aftermarket|pirate)\b/i;

const results = {};
const unmatched = [];

for (const [consoleName, repo] of Object.entries(REPO_BY_CONSOLE)) {
  const tree = await fetchTree(repo);
  const parsed = tree.map(baseTitleAndTags);
  const gamesForConsole = GAMES.filter((g) => g.console === consoleName);

  for (const game of gamesForConsole) {
    const regionTag = REGION_TAG[game.region];
    const variants = queryVariants(game.title);

    let matches = [];
    for (const q of variants) {
      matches = parsed.filter(
        (p) => p.norm.length >= MIN_MATCH_LEN && (p.norm.includes(q) || q.includes(p.norm)),
      );
      if (matches.length > 0) break;
    }

    if (matches.length === 0) {
      unmatched.push(`${game.id} :: "${game.title}" [${consoleName}/${game.region}]`);
      continue;
    }

    const clean = matches.filter((c) => !c.tags.some((t) => BAD_TAG.test(t)));
    const pool = clean.length ? clean : matches;

    const byRegion = pool.filter((c) => c.tags.some((t) => t.includes(regionTag)));
    const scoped = byRegion.length ? byRegion : pool.filter((c) => c.tags.some((t) => t.includes("World")));
    const finalPool = scoped.length ? scoped : pool;

    // Prefer the shortest/most specific title match, then the plainest release
    // (fewest tags, and avoid re-release bundles like "Collector's Edition" or
    // "GameCube"/"Virtual Console" ports when a standalone original exists).
    const DEPRIORITIZE = /collector|virtual console|gamecube|debug|kiosk|demo|rev\s*\d/i;
    finalPool.sort((a, b) => {
      if (a.norm.length !== b.norm.length) return a.norm.length - b.norm.length;
      const aBad = a.tags.some((t) => DEPRIORITIZE.test(t)) ? 1 : 0;
      const bBad = b.tags.some((t) => DEPRIORITIZE.test(t)) ? 1 : 0;
      if (aBad !== bBad) return aBad - bBad;
      return a.tags.length - b.tags.length;
    });
    const best = finalPool[0];

    results[game.id] = `https://raw.githubusercontent.com/libretro-thumbnails/${repo}/master/${encodeURI(best.path)}`;
  }
}

// Manual overrides for titles where automated Hepburn-romanization matching
// (macron -> doubled vowel, e.g. "ō" commonly rendered "ou") isn't worth
// generalizing for a handful of one-off cases.
const MANUAL = {
  "jp-fds-zelda2": "Nintendo_-_Family_Computer_Disk_System/Named_Boxarts/Link no Bouken - The Legend of Zelda 2 (Japan).png",
  "jp-gbc-oracle-ages": "Nintendo_-_Game_Boy_Color/Named_Boxarts/Zelda no Densetsu - Fushigi no Kinomi - Jikuu no Shou (Japan).png",
  "na-gba-alttp-fs": "Nintendo_-_Game_Boy_Advance/Named_Boxarts/Legend of Zelda, The - A Link to the Past _ Four Swords (USA).png",
  "pal-gba-alttp-fs": "Nintendo_-_Game_Boy_Advance/Named_Boxarts/Legend of Zelda, The - A Link to the Past _ Four Swords (Europe) (En,Fr,De,Es,It).png",
  "jp-gba-alttp-fs": "Nintendo_-_Game_Boy_Advance/Named_Boxarts/Zelda no Densetsu - Kamigami no Triforce _ 4tsu no Tsurugi (Japan).png",
  "jp-gba-minish-cap": "Nintendo_-_Game_Boy_Advance/Named_Boxarts/Zelda no Densetsu - Fushigi no Boushi (Japan).png",
  "na-gb-la": "Nintendo_-_Game_Boy/Named_Boxarts/Legend of Zelda, The - Link's Awakening (USA, Europe).png",
  "pal-gb-la": "Nintendo_-_Game_Boy/Named_Boxarts/Legend of Zelda, The - Link's Awakening (USA, Europe).png",
  "pal-ds-tingle-rosy-rupeeland":
    "Nintendo_-_Nintendo_DS/Named_Boxarts/Freshly-Picked - Tingle's Rosy Rupeeland (Europe) (En,Fr,De,Es,It).png",
  "jp-ds-tingle-rupeeland": "Nintendo_-_Nintendo_DS/Named_Boxarts/Mogitate Tingle no Barairo Rupee Land (Japan).png",
  "jp-ds-tingle-balloon-fight":
    "Nintendo_-_Nintendo_DS/Named_Boxarts/Tingle no Balloon Fight DS (Japan) (Club Nintendo).png",
  "jp-gba-famicom-mini-z1":
    "Nintendo_-_Game_Boy_Advance/Named_Boxarts/Famicom Mini 05 - Zelda no Densetsu 1 - The Hyrule Fantasy (Japan).png",
  "jp-gba-famicom-mini-z2":
    "Nintendo_-_Game_Boy_Advance/Named_Boxarts/Famicom Mini 25 - The Legend of Zelda 2 - Link no Bouken (Japan).png",
  "pal-gba-classic-nes-z1":
    "Nintendo_-_Game_Boy_Advance/Named_Boxarts/Classic NES Series - The Legend of Zelda (USA, Europe).png",
};
// No Japanese box art exists in the source repos for these — drop any
// incidental wrong match rather than show a misleading cover.
const NO_ART = ["jp-gc-fs-adventures", "jp-ds-spirit-tracks"];

for (const [id, path] of Object.entries(MANUAL)) {
  const [repo, ...rest] = path.split("/");
  results[id] = `https://raw.githubusercontent.com/libretro-thumbnails/${repo}/master/${encodeURI(rest.join("/"))}`;
  const idx = unmatched.findIndex((u) => u.startsWith(id + " "));
  if (idx !== -1) unmatched.splice(idx, 1);
}
for (const id of NO_ART) {
  delete results[id];
  if (!unmatched.some((u) => u.startsWith(id + " "))) unmatched.push(id + " (no source art)");
}

writeFileSync("./covers-result.json", JSON.stringify(results, null, 2));
writeFileSync("./covers-unmatched.txt", unmatched.join("\n"));
console.log(`Matched: ${Object.keys(results).length}`);
console.log(`Unmatched: ${unmatched.length}`);
