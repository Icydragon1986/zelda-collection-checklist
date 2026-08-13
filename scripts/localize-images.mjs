import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const sources = [
  ["src/data/covers.ts", "games"],
  ["src/data/amiiboCovers.ts", "amiibo-figures"],
  ["src/data/amiiboPackageCovers.ts", "amiibo-packages"],
  ["src/data/specialConsoles.ts", "consoles"],
];
const mimeExtensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "image/avif": ".avif",
};

async function download(url) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        headers: {
          "User-Agent": "Zelda-Collection-Checklist/0.3 image archival",
          Accept: "image/avif,image/webp,image/png,image/jpeg,image/svg+xml,image/*;q=0.8,*/*;q=0.2",
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = (response.headers.get("content-type") || "").split(";")[0].toLowerCase();
      if (!contentType.startsWith("image/")) throw new Error(`type inattendu: ${contentType || "inconnu"}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 200) throw new Error(`fichier trop petit: ${bytes.length} octets`);
      return { bytes, contentType };
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }
  throw lastError;
}

const jobs = [];
for (const [file, category] of sources) {
  const text = await readFile(file, "utf8");
  const urls = [
    ...[...text.matchAll(/"(https?:\/\/[^"\r\n]+)"/g)].map((match) => match[1]),
    ...[...text.matchAll(/'(https?:\/\/[^'\r\n]+)'/g)].map((match) => match[1]),
  ];
  for (const url of [...new Set(urls)]) jobs.push({ file, category, url, token: url, quoteReplacement: false });
  const zwBase = text.match(/const ZW = "([^"]+)"/)?.[1];
  if (zwBase) {
    const templates = [...text.matchAll(/`\$\{ZW\}([^`]+)`/g)].map((match) => ({ suffix: match[1], token: match[0] }));
    for (const template of templates) jobs.push({ file, category, url: `${zwBase}${template.suffix}`, token: template.token, quoteReplacement: true });
  }
}

const results = [];
let cursor = 0;
async function worker() {
  while (cursor < jobs.length) {
    const job = jobs[cursor++];
    try {
      const { bytes, contentType } = await download(job.url);
      const hash = createHash("sha256").update(job.url).digest("hex").slice(0, 20);
      let extension = mimeExtensions[contentType];
      if (!extension) extension = path.extname(new URL(job.url).pathname).toLowerCase() || ".img";
      const relative = `images/library/${job.category}/${hash}${extension}`;
      const output = path.join("public", ...relative.split("/"));
      await mkdir(path.dirname(output), { recursive: true });
      await writeFile(output, bytes);
      results.push({ ...job, ok: true, bytes: bytes.length, local: `/${relative}` });
    } catch (error) {
      results.push({ ...job, ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  }
}
await Promise.all(Array.from({ length: 8 }, () => worker()));

for (const [file] of sources) {
  let text = await readFile(file, "utf8");
  for (const result of results.filter((item) => item.file === file && item.ok)) {
    text = text.split(result.token).join(result.quoteReplacement ? `"${result.local}"` : result.local);
  }
  await writeFile(file, text);
}

const report = {
  generatedAt: new Date().toISOString(),
  total: results.length,
  downloaded: results.filter((item) => item.ok).length,
  failed: results.filter((item) => !item.ok),
  totalBytes: results.filter((item) => item.ok).reduce((sum, item) => sum + item.bytes, 0),
};
await mkdir("reports", { recursive: true });
await writeFile("reports/image-localization.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, failed: report.failed.length }, null, 2));
