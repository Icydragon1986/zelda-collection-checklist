const HEX = {
  "amiibo-smash-link": "0100000000040002",
  "amiibo-smash-zelda": "01010000000e0002",
  "amiibo-smash-sheik": "0101010000170002",
  "amiibo-smash-toon-link": "0100010000160002",
  "amiibo-smash-ganondorf": "01020100001b0002",
  "amiibo-smash-young-link": "01000000037c0002",

  "amiibo-30th-link-8bit": "01000000034f0902",
  "amiibo-30th-link-oot": "01000000034b0902",
  "amiibo-30th-toon-link-ww": "0100010003500902",
  "amiibo-30th-toon-zelda": "0101000003520902",

  "amiibo-tp-wolf-link": "01030000024f0902",

  "amiibo-hist-link-mm": "01000000034c0902",
  "amiibo-hist-link-ss": "01000000034e0902",
  "amiibo-hist-link-tp": "01000000034d0902",

  "amiibo-botw-link-archer": "0100000003530902",
  "amiibo-botw-link-rider": "0100000003540902",
  "amiibo-botw-zelda": "0101000003560902",
  "amiibo-botw-guardian": "0140000003550902",
  "amiibo-botw-bokoblin": "01410000035c0902",
  "amiibo-botw-mipha": "01070000035a0902",
  "amiibo-botw-daruk": "0105000003580902",
  "amiibo-botw-revali": "01080000035b0902",
  "amiibo-botw-urbosa": "0106000003590902",

  "amiibo-ss-zelda-loftwing": "0101030004140902",

  "amiibo-la-link": "0100000003990902",

  "amiibo-totk-link": "0100000004180902",
  "amiibo-totk-zelda": "0101000004190902",
  "amiibo-totk-ganondorf": "01020100041a0902",
  "amiibo-totk-tulin": "010b000004a50902",
  "amiibo-totk-yunobo": "010c000004a60902",
  "amiibo-totk-sidon": "010a000004a40902",
  "amiibo-totk-riju": "0109000004a30902",
  // amiibo-totk-mineru: pas encore sorti, aucune image officielle disponible.
};

const results = {};
for (const [id, hex] of Object.entries(HEX)) {
  const head = hex.slice(0, 8);
  const tail = hex.slice(8, 16);
  results[id] = `https://raw.githubusercontent.com/N3evin/AmiiboAPI/master/images/icon_${head}-${tail}.png`;
}

await import("node:fs").then((fs) => fs.writeFileSync("./amiibo-covers-result.json", JSON.stringify(results, null, 2)));
console.log(`Mapped: ${Object.keys(results).length}`);
