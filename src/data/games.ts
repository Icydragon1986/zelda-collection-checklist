import type { Game } from "./types";

// ---------------------------------------------------------------------------
// Amérique du Nord
// ---------------------------------------------------------------------------
const NA: Game[] = [
  { id: "na-nes-zelda1", title: "The Legend of Zelda", console: "NES", region: "NA", year: 1987, category: "main" },
  { id: "na-nes-zelda1-classic-gray", title: "The Legend of Zelda – Classic Series (cartouche grise)", console: "NES", region: "NA", year: 1992, category: "edition", notes: "Réédition commerciale Classic Series avec cartouche grise et nouvelle étiquette (NES-ZL-USA-1), distincte de la cartouche dorée originale." },
  { id: "na-nes-zelda2", title: "Zelda II: The Adventure of Link", console: "NES", region: "NA", year: 1988, category: "main" },
  { id: "na-nes-zelda2-classic-gray", title: "Zelda II: The Adventure of Link – Classic Series (cartouche grise)", console: "NES", region: "NA", year: 1992, category: "edition", notes: "Réédition commerciale Classic Series avec cartouche grise (NES-AL-USA-1), distincte de la cartouche dorée originale." },

  { id: "na-snes-alttp", title: "A Link to the Past", console: "SNES", region: "NA", year: 1992, category: "main" },
  { id: "na-snes-alttp-fr-can", title: "A Link to the Past – Version canadienne-française", console: "SNES", region: "NA", year: 1992, category: "edition", notes: "Édition canadienne entièrement en français. Les différentes impressions SNS-ZF-CAN ne sont volontairement pas séparées." },
  { id: "na-snes-alttp-players-choice", title: "A Link to the Past – Player's Choice", console: "SNES", region: "NA", year: 1996, category: "edition", notes: "Réédition Million Seller / Player's Choice avec étiquette et boîte distinctes. Les changements mineurs de cote ESRB K-A/E ne sont pas séparés ici." },

  { id: "na-gb-la", title: "Link's Awakening", console: "Game Boy", region: "NA", year: 1993, category: "main" },

  { id: "na-cdi-faces-of-evil", title: "Link: The Faces of Evil", console: "Philips CD-i", region: "NA", year: 1993, category: "curiosity", notes: "Développé par Philips/Animation Magic, non-Nintendo." },
  { id: "na-cdi-wand-of-gamelon", title: "Zelda: The Wand of Gamelon", console: "Philips CD-i", region: "NA", year: 1993, category: "curiosity", notes: "Développé par Philips/Animation Magic, non-Nintendo." },

  { id: "na-gbc-la-dx", title: "Link's Awakening DX", console: "Game Boy Color", region: "NA", year: 1998, category: "main" },
  { id: "na-gbc-oracle-ages", title: "Oracle of Ages", console: "Game Boy Color", region: "NA", year: 2001, category: "main" },
  { id: "na-gbc-oracle-seasons", title: "Oracle of Seasons", console: "Game Boy Color", region: "NA", year: 2001, category: "main" },

  { id: "na-n64-oot", title: "Ocarina of Time", console: "Nintendo 64", region: "NA", year: 1998, category: "main" },
  { id: "na-n64-oot-collectors", title: "Ocarina of Time – Collector's Edition (cartouche dorée)", console: "Nintendo 64", region: "NA", year: 1998, category: "edition", notes: "Cartouche dorée offerte à la précommande (au lieu de la cartouche grise standard), boîte marquée « Collector's Edition ». Une fois le stock initial écoulé, tous les réassorts sont repassés à la cartouche grise standard — révision de cartouche v1.0 uniquement." },
  { id: "na-n64-mm", title: "Majora's Mask", console: "Nintendo 64", region: "NA", year: 2000, category: "main" },
  { id: "na-n64-mm-collectors", title: "Majora's Mask – Collector's Edition (étiquette holographique)", console: "Nintendo 64", region: "NA", year: 2000, category: "edition", notes: "Édition précommande avec étiquette holographique sur la cartouche dorée et boîte marquée « Collector's Edition » (contenu du jeu identique aux cartouches dorées standard, qui étaient la norme pour ce titre)." },

  { id: "na-gba-alttp-fs", title: "A Link to the Past & Four Swords", console: "Game Boy Advance", region: "NA", year: 2002, category: "main", notes: "Cartouche 2-en-1 : portage d'A Link to the Past + le nouveau jeu multijoueur Four Swords." },
  { id: "na-gba-classic-nes-z1", title: "Classic NES Series: The Legend of Zelda", console: "Game Boy Advance", region: "NA", year: 2004, category: "compilation" },
  { id: "na-gba-classic-nes-z2", title: "Classic NES Series: Zelda II", console: "Game Boy Advance", region: "NA", year: 2004, category: "compilation" },
  { id: "na-gba-minish-cap", title: "The Minish Cap", console: "Game Boy Advance", region: "NA", year: 2005, category: "main" },

  { id: "na-gc-oot-mq", title: "Ocarina of Time / Master Quest", console: "GameCube", region: "NA", year: 2003, category: "compilation", notes: "Disque bonus offert en précommande de The Wind Waker — jamais vendu comme SKU standard." },
  { id: "na-gc-collectors-edition", title: "The Legend of Zelda: Collector's Edition", console: "GameCube", region: "NA", year: 2003, category: "compilation", notes: "Promo uniquement (Nintendo Power / achat de console) : Zelda 1, Zelda II, Ocarina of Time, Majora's Mask + démo Wind Waker." },
  { id: "na-gc-wind-waker", title: "The Wind Waker", console: "GameCube", region: "NA", year: 2003, category: "main" },
  { id: "na-gc-wind-waker-master-quest-bundle", title: "The Wind Waker + Ocarina of Time / Master Quest", console: "GameCube", region: "NA", year: 2003, category: "edition", notes: "Édition nord-américaine en boîtier double disque : The Wind Waker avec le disque bonus contenant Ocarina of Time et Master Quest. Produit distinct du disque bonus offert seul en précommande." },
  { id: "na-gc-wind-waker-metroid-prime-combo", title: "The Wind Waker + Metroid Prime – Combo Pack", console: "GameCube", region: "NA", year: 2005, category: "edition", notes: "Rare coffret double jeu nord-américain distribué avec certains ensembles GameCube; contient les disques et livrets de The Wind Waker et Metroid Prime dans un boîtier commun." },
  { id: "na-gc-fs-adventures", title: "Four Swords Adventures", console: "GameCube", region: "NA", year: 2004, category: "main" },
  { id: "na-gc-tp", title: "Twilight Princess", console: "GameCube", region: "NA", year: 2006, category: "main" },

  { id: "na-ds-phantom-hourglass", title: "Phantom Hourglass", console: "Nintendo DS", region: "NA", year: 2007, category: "main" },
  { id: "na-ds-spirit-tracks", title: "Spirit Tracks", console: "Nintendo DS", region: "NA", year: 2009, category: "main" },

  { id: "na-wii-tp", title: "Twilight Princess", console: "Wii", region: "NA", year: 2006, category: "main" },
  { id: "na-wii-crossbow-training", title: "Link's Crossbow Training", console: "Wii", region: "NA", year: 2007, category: "spinoff", notes: "Vendu avec le périphérique Wii Zapper." },
  { id: "na-wii-skyward-sword", title: "Skyward Sword", console: "Wii", region: "NA", year: 2011, category: "main" },
  { id: "na-wii-ss-gold", title: "Skyward Sword – Limited Edition (Wiimote Plus dorée)", console: "Wii", region: "NA", year: 2011, category: "edition", notes: "Wiimote Plus dorée (motif Triforce/blason royal) + CD 25e anniversaire." },

  { id: "na-3ds-oot3d", title: "Ocarina of Time 3D", console: "Nintendo 3DS", region: "NA", year: 2011, category: "main" },
  { id: "na-3ds-albw", title: "A Link Between Worlds", console: "Nintendo 3DS", region: "NA", year: 2013, category: "main" },
  { id: "na-3ds-mm3d", title: "Majora's Mask 3D", console: "Nintendo 3DS", region: "NA", year: 2015, category: "main" },
  { id: "na-3ds-mm3d-limited", title: "Majora's Mask 3D – Limited Edition", console: "Nintendo 3DS", region: "NA", year: 2015, category: "edition", notes: "Figurine Skull Kid dans une boîte artbox. Exclusivité Amazon/GameStop/Fry's." },
  { id: "na-3ds-tfh", title: "Tri Force Heroes", console: "Nintendo 3DS", region: "NA", year: 2015, category: "main" },
  { id: "na-3ds-hw-legends", title: "Hyrule Warriors Legends", console: "Nintendo 3DS", region: "NA", year: 2016, category: "spinoff" },

  { id: "na-wiiu-wwhd", title: "The Wind Waker HD", console: "Wii U", region: "NA", year: 2013, category: "main" },
  { id: "na-wiiu-wwhd-ganondorf", title: "The Wind Waker HD – Édition Ganondorf", console: "Wii U", region: "NA", year: 2013, category: "edition", notes: "Exclusivité GameStop : jeu + figurine Ganondorf." },
  { id: "na-wiiu-hw", title: "Hyrule Warriors", console: "Wii U", region: "NA", year: 2014, category: "spinoff" },
  { id: "na-wiiu-hw-limited", title: "Hyrule Warriors – Limited Edition", console: "Wii U", region: "NA", year: 2014, category: "edition", notes: "Boîte cartonnée + écharpe (disponibilité en PAL non confirmée)." },
  { id: "na-wiiu-tphd", title: "Twilight Princess HD", console: "Wii U", region: "NA", year: 2016, category: "main" },
  { id: "na-wiiu-tphd-wolflink", title: "Twilight Princess HD – amiibo Edition", console: "Wii U", region: "NA", year: 2016, category: "edition", notes: "Jeu + amiibo Wolf Link (débloque le Repaire de l'Ombre)." },
  { id: "na-wiiu-botw", title: "Breath of the Wild", console: "Wii U", region: "NA", year: 2017, category: "main" },

  { id: "na-switch-botw", title: "Breath of the Wild", console: "Nintendo Switch", region: "NA", year: 2017, category: "main" },
  { id: "na-switch-botw-special", title: "Breath of the Wild – Special Edition", console: "Nintendo Switch", region: "NA", year: 2017, category: "edition", notes: "Étui Sheikah Slate, pièce Œil Sheikah, tapisserie carte du monde, CD bande-son." },
  { id: "na-switch-botw-master", title: "Breath of the Wild – Master Edition", console: "Nintendo Switch", region: "NA", year: 2017, category: "edition", notes: "Contenu de la Special Edition + statuette de l'Épée de Legend." },
  { id: "na-switch-hw-definitive", title: "Hyrule Warriors: Definitive Edition", console: "Nintendo Switch", region: "NA", year: 2018, category: "spinoff" },
  { id: "na-switch-cadence", title: "Cadence of Hyrule", console: "Nintendo Switch", region: "NA", year: 2020, category: "spinoff", notes: "Sortie numérique en 2019, version physique en 2020." },
  { id: "na-switch-la-remake", title: "Link's Awakening (remake)", console: "Nintendo Switch", region: "NA", year: 2019, category: "main" },
  { id: "na-switch-la-dreamer", title: "Link's Awakening – Dreamer Edition", console: "Nintendo Switch", region: "NA", year: 2019, category: "edition", notes: "Jeu + artbook cartonné \"Dreamer\" (sans SteelBook, contrairement à la version PAL)." },
  { id: "na-switch-hw-age-calamity", title: "Hyrule Warriors: Age of Calamity", console: "Nintendo Switch", region: "NA", year: 2020, category: "spinoff" },
  { id: "na-switch-ss-hd", title: "Skyward Sword HD", console: "Nintendo Switch", region: "NA", year: 2021, category: "main" },
  { id: "na-switch-totk", title: "Tears of the Kingdom", console: "Nintendo Switch", region: "NA", year: 2023, category: "main" },
  { id: "na-switch-totk-collectors", title: "Tears of the Kingdom – Collector's Edition", console: "Nintendo Switch", region: "NA", year: 2023, category: "edition", notes: "Boîtier SteelBook, artbook, poster \"Iconart\", set de 4 pins." },
  { id: "na-switch-eow", title: "Echoes of Wisdom", console: "Nintendo Switch", region: "NA", year: 2024, category: "main" },

  { id: "na-switch2-botw", title: "Breath of the Wild – Nintendo Switch 2 Edition", console: "Nintendo Switch 2", region: "NA", year: 2025, category: "main", notes: "Cartouche physique complète — distincte de l'Upgrade Pack numérique." },
  { id: "na-switch2-totk", title: "Tears of the Kingdom – Nintendo Switch 2 Edition", console: "Nintendo Switch 2", region: "NA", year: 2025, category: "main", notes: "Cartouche physique complète — distincte de l'Upgrade Pack numérique." },
  { id: "na-switch2-hw-imprisonment", title: "Hyrule Warriors: Age of Imprisonment", console: "Nintendo Switch 2", region: "NA", year: 2025, category: "spinoff", notes: "Cartouche physique complète (pas une Game-Key Card)." },
];

// ---------------------------------------------------------------------------
// PAL (Europe / Australie)
// ---------------------------------------------------------------------------
const PAL: Game[] = [
  { id: "pal-nes-zelda1", title: "The Legend of Zelda", console: "NES", region: "PAL", year: 1987, category: "main" },
  { id: "pal-nes-zelda2", title: "Zelda II: The Adventure of Link", console: "NES", region: "PAL", year: 1988, category: "main" },

  { id: "pal-snes-alttp", title: "A Link to the Past", console: "SNES", region: "PAL", year: 1992, category: "main" },

  { id: "pal-gb-la", title: "Link's Awakening", console: "Game Boy", region: "PAL", year: 1993, category: "main" },

  { id: "pal-cdi-faces-of-evil", title: "Link: The Faces of Evil", console: "Philips CD-i", region: "PAL", year: 1993, category: "curiosity", notes: "Développé par Philips/Animation Magic, non-Nintendo. Date PAL précise incertaine." },
  { id: "pal-cdi-wand-of-gamelon", title: "Zelda: The Wand of Gamelon", console: "Philips CD-i", region: "PAL", year: 1993, category: "curiosity", notes: "Développé par Philips/Animation Magic, non-Nintendo. Date PAL précise incertaine." },
  { id: "pal-cdi-zeldas-adventure", title: "Zelda's Adventure", console: "Philips CD-i", region: "PAL", year: 1995, category: "curiosity", notes: "Développé par Philips/Animation Magic, non-Nintendo." },

  { id: "pal-gbc-la-dx", title: "Link's Awakening DX", console: "Game Boy Color", region: "PAL", year: 1999, category: "main" },
  { id: "pal-gbc-oracle-ages", title: "Oracle of Ages", console: "Game Boy Color", region: "PAL", year: 2001, category: "main" },
  { id: "pal-gbc-oracle-seasons", title: "Oracle of Seasons", console: "Game Boy Color", region: "PAL", year: 2001, category: "main" },

  { id: "pal-n64-oot", title: "Ocarina of Time", console: "Nintendo 64", region: "PAL", year: 1998, category: "main" },
  { id: "pal-n64-oot-aus-gold", title: "Ocarina of Time – Édition australienne (cartouche dorée)", console: "Nintendo 64", region: "PAL", year: 1998, category: "edition", notes: "Variante commerciale Australie/Nouvelle-Zélande : cartouche dorée et boîte PAL australienne dorée, contrairement à la cartouche grise de l'édition européenne courante." },
  { id: "pal-n64-mm", title: "Majora's Mask", console: "Nintendo 64", region: "PAL", year: 2000, category: "main" },

  { id: "pal-gba-alttp-fs", title: "A Link to the Past & Four Swords", console: "Game Boy Advance", region: "PAL", year: 2003, category: "main" },
  { id: "pal-gba-classic-nes-z1", title: "NES Classics: The Legend of Zelda", console: "Game Boy Advance", region: "PAL", year: 2004, category: "compilation" },
  { id: "pal-gba-classic-nes-z2", title: "NES Classics: Zelda II", console: "Game Boy Advance", region: "PAL", year: 2005, category: "compilation", notes: "Sorti environ un an après les versions NA/JP." },
  { id: "pal-gba-minish-cap", title: "The Minish Cap", console: "Game Boy Advance", region: "PAL", year: 2004, category: "main", notes: "Sorti avant la version NA." },

  { id: "pal-gc-oot-mq", title: "Ocarina of Time / Master Quest", console: "GameCube", region: "PAL", year: 2003, category: "compilation", notes: "Disque bonus lié à la précommande de The Wind Waker." },
  { id: "pal-gc-collectors-edition", title: "The Legend of Zelda: Collector's Edition", console: "GameCube", region: "PAL", year: 2003, category: "compilation", notes: "Distribué en bundle avec Mario Kart: Double Dash!!." },
  { id: "pal-gc-wind-waker", title: "The Wind Waker", console: "GameCube", region: "PAL", year: 2003, category: "main" },
  { id: "pal-gc-fs-adventures", title: "Four Swords Adventures", console: "GameCube", region: "PAL", year: 2005, category: "main", notes: "N'inclut pas le mode bonus japonais \"Tetra's Trackers\"." },
  { id: "pal-gc-tp", title: "Twilight Princess", console: "GameCube", region: "PAL", year: 2006, category: "main" },

  { id: "pal-ds-phantom-hourglass", title: "Phantom Hourglass", console: "Nintendo DS", region: "PAL", year: 2007, category: "main" },
  { id: "pal-ds-tingle-rosy-rupeeland", title: "Freshly-Picked Tingle's Rosy Rupeeland", console: "Nintendo DS", region: "PAL", year: 2007, category: "spinoff", notes: "Jamais sorti en Amérique du Nord." },
  { id: "pal-ds-spirit-tracks", title: "Spirit Tracks", console: "Nintendo DS", region: "PAL", year: 2009, category: "main" },
  { id: "pal-ds-spirit-tracks-tin", title: "Spirit Tracks – Limited Edition", console: "Nintendo DS", region: "PAL", year: 2009, category: "edition", notes: "Boîtier métallique + figurines Link et Phantom. Exclusivité Gamestation (UK) au lancement — pas d'équivalent NA/JP." },

  { id: "pal-wii-tp", title: "Twilight Princess", console: "Wii", region: "PAL", year: 2006, category: "main" },
  { id: "pal-wii-crossbow-training", title: "Link's Crossbow Training", console: "Wii", region: "PAL", year: 2007, category: "spinoff", notes: "Vendu avec le périphérique Wii Zapper." },
  { id: "pal-wii-skyward-sword", title: "Skyward Sword", console: "Wii", region: "PAL", year: 2011, category: "main", notes: "Première région mondiale à recevoir le jeu." },
  { id: "pal-wii-ss-gold", title: "Skyward Sword – Limited Edition (Wiimote Plus dorée)", console: "Wii", region: "PAL", year: 2011, category: "edition", notes: "Wiimote Plus dorée + CD 25e anniversaire." },

  { id: "pal-3ds-oot3d", title: "Ocarina of Time 3D", console: "Nintendo 3DS", region: "PAL", year: 2011, category: "main" },
  { id: "pal-3ds-albw", title: "A Link Between Worlds", console: "Nintendo 3DS", region: "PAL", year: 2013, category: "main" },
  { id: "pal-3ds-mm3d", title: "Majora's Mask 3D", console: "Nintendo 3DS", region: "PAL", year: 2015, category: "main" },
  { id: "pal-3ds-mm3d-special", title: "Majora's Mask 3D – Special Edition", console: "Nintendo 3DS", region: "PAL", year: 2015, category: "edition", notes: "Boîtier SteelBook + pin's + poster recto-verso (contenu différent de l'édition NA, pas de figurine)." },
  { id: "pal-3ds-tfh", title: "Tri Force Heroes", console: "Nintendo 3DS", region: "PAL", year: 2015, category: "main" },
  { id: "pal-3ds-hw-legends", title: "Hyrule Warriors Legends", console: "Nintendo 3DS", region: "PAL", year: 2016, category: "spinoff" },
  { id: "pal-3ds-hw-legends-limited", title: "Hyrule Warriors Legends – Limited Edition", console: "Nintendo 3DS", region: "PAL", year: 2016, category: "edition", notes: "Jeu + horloge-boussole de Linkle." },

  { id: "pal-wiiu-wwhd", title: "The Wind Waker HD", console: "Wii U", region: "PAL", year: 2013, category: "main" },
  { id: "pal-wiiu-wwhd-ganondorf", title: "The Wind Waker HD – Édition Ganondorf", console: "Wii U", region: "PAL", year: 2013, category: "edition", notes: "Exclusivité GAME (UK) : jeu + figurine Ganondorf." },
  { id: "pal-wiiu-hw", title: "Hyrule Warriors", console: "Wii U", region: "PAL", year: 2014, category: "spinoff" },
  { id: "pal-wiiu-tphd", title: "Twilight Princess HD", console: "Wii U", region: "PAL", year: 2016, category: "main" },
  { id: "pal-wiiu-tphd-wolflink", title: "Twilight Princess HD – amiibo Edition", console: "Wii U", region: "PAL", year: 2016, category: "edition", notes: "Jeu + amiibo Wolf Link (débloque le Repaire de l'Ombre)." },
  { id: "pal-wiiu-botw", title: "Breath of the Wild", console: "Wii U", region: "PAL", year: 2017, category: "main" },

  { id: "pal-switch-botw", title: "Breath of the Wild", console: "Nintendo Switch", region: "PAL", year: 2017, category: "main" },
  { id: "pal-switch-botw-limited", title: "Breath of the Wild – Limited Edition", console: "Nintendo Switch", region: "PAL", year: 2017, category: "edition", notes: "CD bande-son + statuette de l'Épée de Legend (pas d'étui Sheikah ni de tapisserie, contrairement aux éditions NA)." },
  { id: "pal-switch-hw-definitive", title: "Hyrule Warriors: Definitive Edition", console: "Nintendo Switch", region: "PAL", year: 2018, category: "spinoff" },
  { id: "pal-switch-cadence", title: "Cadence of Hyrule", console: "Nintendo Switch", region: "PAL", year: 2020, category: "spinoff" },
  { id: "pal-switch-la-remake", title: "Link's Awakening (remake)", console: "Nintendo Switch", region: "PAL", year: 2019, category: "main" },
  { id: "pal-switch-la-limited", title: "Link's Awakening – Limited Edition", console: "Nintendo Switch", region: "PAL", year: 2019, category: "edition", notes: "Artbook 120 pages + boîtier SteelBook façon Game Boy, en coffret." },
  { id: "pal-switch-hw-age-calamity", title: "Hyrule Warriors: Age of Calamity", console: "Nintendo Switch", region: "PAL", year: 2020, category: "spinoff" },
  { id: "pal-switch-ss-hd", title: "Skyward Sword HD", console: "Nintendo Switch", region: "PAL", year: 2021, category: "main" },
  { id: "pal-switch-totk", title: "Tears of the Kingdom", console: "Nintendo Switch", region: "PAL", year: 2023, category: "main" },
  { id: "pal-switch-totk-collectors", title: "Tears of the Kingdom – Collector's Edition", console: "Nintendo Switch", region: "PAL", year: 2023, category: "edition", notes: "Boîtier SteelBook, artbook, poster \"Iconart\", set de 4 pins." },
  { id: "pal-switch-eow", title: "Echoes of Wisdom", console: "Nintendo Switch", region: "PAL", year: 2024, category: "main" },

  { id: "pal-switch2-botw", title: "Breath of the Wild – Nintendo Switch 2 Edition", console: "Nintendo Switch 2", region: "PAL", year: 2025, category: "main" },
  { id: "pal-switch2-totk", title: "Tears of the Kingdom – Nintendo Switch 2 Edition", console: "Nintendo Switch 2", region: "PAL", year: 2025, category: "main" },
  { id: "pal-switch2-hw-imprisonment", title: "Hyrule Warriors: Age of Imprisonment", console: "Nintendo Switch 2", region: "PAL", year: 2025, category: "spinoff" },
];

// ---------------------------------------------------------------------------
// Japon
// ---------------------------------------------------------------------------
const JP: Game[] = [
  { id: "jp-fds-zelda1", title: "Zelda no Densetsu (The Hyrule Fantasy)", console: "Famicom Disk System", region: "JP", year: 1986, category: "main" },
  { id: "jp-fds-zelda2", title: "Zelda no Densetsu 2: Link no Bōken", console: "Famicom Disk System", region: "JP", year: 1987, category: "main" },
  { id: "jp-famicom-zelda1", title: "Zelda no Densetsu 1 (cartouche Famicom)", console: "Famicom", region: "JP", year: 1994, category: "main", notes: "Réédition physique officielle sur cartouche Famicom verte (HVC-ZL), distincte de la Disk Card Famicom Disk System de 1986. Sortie le 19 février 1994." },

  { id: "jp-bs-zelda-map1", title: "BS Zelda no Densetsu (Map 1)", console: "Satellaview", region: "JP", year: 1995, category: "broadcast", notes: "Diffusion satellite hebdomadaire, pas un produit retail standard. Utilise un avatar BS-X, pas Link." },
  { id: "jp-bs-zelda-map2", title: "BS Zelda no Densetsu (Map 2)", console: "Satellaview", region: "JP", year: 1996, category: "broadcast", notes: "Diffusion satellite, version remixée." },
  { id: "jp-bs-zelda-ist", title: "BS Zelda no Densetsu: Inishie no Sekiban (Ancient Stone Tablets)", console: "Satellaview", region: "JP", year: 1997, category: "broadcast", notes: "Suite se déroulant 6 ans après A Link to the Past." },

  { id: "jp-snes-alttp", title: "Zelda no Densetsu: Kamigami no Triforce", console: "SNES", region: "JP", year: 1991, category: "main", notes: "Titre japonais : \"Triforce of the Gods\"." },

  { id: "jp-gb-la", title: "Zelda no Densetsu: Yume o Miru Shima", console: "Game Boy", region: "JP", year: 1993, category: "main", notes: "Titre littéral \"Island of the Dreaming\", sans référence à Link." },

  { id: "jp-gbc-la-dx", title: "Yume o Miru Shima DX", console: "Game Boy Color", region: "JP", year: 1998, category: "main" },
  { id: "jp-gbc-oracle-ages", title: "Fushigi no Ki no Mi: Jikū no Shō", console: "Game Boy Color", region: "JP", year: 2001, category: "main" },
  { id: "jp-gbc-oracle-seasons", title: "Fushigi no Ki no Mi: Daichi no Shō", console: "Game Boy Color", region: "JP", year: 2001, category: "main" },

  { id: "jp-n64-oot", title: "Zelda no Densetsu: Toki no Ocarina", console: "Nintendo 64", region: "JP", year: 1998, category: "main" },
  { id: "jp-n64-mm", title: "Zelda no Densetsu: Mujura no Kamen", console: "Nintendo 64", region: "JP", year: 2000, category: "main" },
  { id: "jp-n64-mm-expansion-pak", title: "Zelda no Densetsu: Mujura no Kamen – Expansion Pak Big Box", console: "Nintendo 64", region: "JP", year: 2000, category: "edition", notes: "Grande boîte japonaise officielle (NUS-NZSJ-JPN) contenant le jeu et le Memory Expansion Pak. Sortie le 27 avril 2000." },

  { id: "jp-gba-alttp-fs", title: "Kamigami no Triforce & 4tsu no Tsurugi", console: "Game Boy Advance", region: "JP", year: 2003, category: "main" },
  { id: "jp-gba-famicom-mini-z1", title: "Famicom Mini: Zelda no Densetsu", console: "Game Boy Advance", region: "JP", year: 2004, category: "compilation" },
  { id: "jp-gba-famicom-mini-z2", title: "Famicom Mini: Zelda no Densetsu 2", console: "Game Boy Advance", region: "JP", year: 2004, category: "compilation" },
  { id: "jp-gba-minish-cap", title: "Fushigi no Bōshi", console: "Game Boy Advance", region: "JP", year: 2004, category: "main" },

  { id: "jp-gc-oot-mq", title: "Zelda no Densetsu: Toki no Ocarina GC (Master Quest)", console: "GameCube", region: "JP", year: 2002, category: "compilation", notes: "Contrairement à NA/PAL, vendu comme produit standalone au Japon (pas un simple bonus de précommande)." },
  { id: "jp-gc-wind-waker", title: "Zelda no Densetsu: Kaze no Takuto", console: "GameCube", region: "JP", year: 2002, category: "main" },
  { id: "jp-gc-fs-adventures", title: "Zelda no Densetsu: 4tsu no Tsurugi+", console: "GameCube", region: "JP", year: 2004, category: "main", notes: "Inclut le mode bonus exclusif \"Tetra's Trackers\" (Navi Trackers), absent des versions NA/PAL." },
  { id: "jp-gc-zelda-collection", title: "Zelda Collection", console: "GameCube", region: "JP", year: 2004, category: "compilation", notes: "Disque promotionnel Club Nintendo (échange de points étoiles)." },
  { id: "jp-gc-tp", title: "Zelda no Densetsu: Twilight Princess", console: "GameCube", region: "JP", year: 2006, category: "main" },

  { id: "jp-ds-phantom-hourglass", title: "Mugen no Sunadokei", console: "Nintendo DS", region: "JP", year: 2007, category: "main" },
  { id: "jp-ds-tingle-rupeeland", title: "Mogitate Tingle no Barairo Rupeeland", console: "Nintendo DS", region: "JP", year: 2006, category: "spinoff", notes: "Localisé en Europe sous le nom \"Freshly-Picked Tingle's Rosy Rupeeland\" ; jamais sorti en Amérique du Nord." },
  { id: "jp-ds-tingle-balloon-fight", title: "Tingle's Balloon Fight DS", console: "Nintendo DS", region: "JP", year: 2007, category: "spinoff", notes: "Exclusif au Japon, distribué uniquement comme récompense Club Nintendo (rang Platine) — jamais vendu en magasin ni sorti ailleurs." },
  { id: "jp-ds-tingle-balloon-trip-love", title: "Irozuki Tingle no Koi no Balloon Trip", console: "Nintendo DS", region: "JP", year: 2009, category: "spinoff", notes: "Exclusif au Japon, aucune sortie NA ou PAL." },
  { id: "jp-ds-spirit-tracks", title: "Reiru no Fue", console: "Nintendo DS", region: "JP", year: 2009, category: "main" },

  { id: "jp-wii-tp", title: "Twilight Princess", console: "Wii", region: "JP", year: 2006, category: "main" },
  { id: "jp-wii-crossbow-training", title: "Wii Zapper: Link no Bowgun Training", console: "Wii", region: "JP", year: 2007, category: "spinoff" },
  { id: "jp-wii-skyward-sword", title: "Skyward Sword", console: "Wii", region: "JP", year: 2011, category: "main" },

  { id: "jp-3ds-oot3d", title: "Toki no Ocarina 3D", console: "Nintendo 3DS", region: "JP", year: 2011, category: "main" },
  { id: "jp-3ds-albw", title: "Kamigami no Triforce 2", console: "Nintendo 3DS", region: "JP", year: 2013, category: "main" },
  { id: "jp-3ds-mm3d", title: "Mujura no Kamen 3D", console: "Nintendo 3DS", region: "JP", year: 2015, category: "main" },
  { id: "jp-3ds-tfh", title: "Toraifōsu Sanjūshi", console: "Nintendo 3DS", region: "JP", year: 2015, category: "main" },
  { id: "jp-3ds-hw-legends", title: "Hyrule Warriors Legends", console: "Nintendo 3DS", region: "JP", year: 2016, category: "spinoff" },
  { id: "jp-3ds-hw-legends-premium", title: "Hyrule Warriors Legends – Premium Box", console: "Nintendo 3DS", region: "JP", year: 2016, category: "edition", notes: "Artbook + réplique de l'horloge-boussole de Linkle." },
  { id: "jp-3ds-hw-legends-treasure", title: "Hyrule Warriors Legends – Treasure Box", console: "Nintendo 3DS", region: "JP", year: 2016, category: "edition", notes: "Contenu de la Premium Box + réplique d'ocarina dorée + peluche fée. Exclusivité Amazon JP / GAMECITY." },

  { id: "jp-wiiu-wwhd", title: "Kaze no Takuto HD", console: "Wii U", region: "JP", year: 2013, category: "main" },
  { id: "jp-wiiu-hw", title: "Hyrule Warriors", console: "Wii U", region: "JP", year: 2014, category: "spinoff" },
  { id: "jp-wiiu-tphd", title: "Twilight Princess HD", console: "Wii U", region: "JP", year: 2016, category: "main" },
  { id: "jp-wiiu-botw", title: "Breath of the Wild", console: "Wii U", region: "JP", year: 2017, category: "main" },

  { id: "jp-switch-botw", title: "Breath of the Wild", console: "Nintendo Switch", region: "JP", year: 2017, category: "main" },
  { id: "jp-switch-botw-collectors", title: "Breath of the Wild – Collector's Edition", console: "Nintendo Switch", region: "JP", year: 2017, category: "edition", notes: "amiibo Link (Rider) exclusif + CD bande-son + tapisserie carte du monde." },
  { id: "jp-switch-hw-definitive", title: "Hyrule Warriors: Definitive Edition", console: "Nintendo Switch", region: "JP", year: 2018, category: "spinoff" },
  { id: "jp-switch-cadence", title: "Cadence of Hyrule", console: "Nintendo Switch", region: "JP", year: 2020, category: "spinoff" },
  { id: "jp-switch-la-remake", title: "Yume o Miru Shima (remake)", console: "Nintendo Switch", region: "JP", year: 2019, category: "main" },
  { id: "jp-switch-hw-age-calamity", title: "Hyrule Warriors: Age of Calamity", console: "Nintendo Switch", region: "JP", year: 2020, category: "spinoff" },
  { id: "jp-switch-hw-age-calamity-treasure", title: "Hyrule Warriors: Age of Calamity – Treasure Box", console: "Nintendo Switch", region: "JP", year: 2020, category: "edition", notes: "Plaque d'art acrylique + couverture imprimée (paravent) + breloque métallique Gardien. Exclusivité japonaise." },
  { id: "jp-switch-ss-hd", title: "Skyward Sword HD", console: "Nintendo Switch", region: "JP", year: 2021, category: "main" },
  { id: "jp-switch-totk", title: "Tears of the Kingdom", console: "Nintendo Switch", region: "JP", year: 2023, category: "main" },
  { id: "jp-switch-totk-collectors", title: "Tears of the Kingdom – Collector's Edition", console: "Nintendo Switch", region: "JP", year: 2023, category: "edition", notes: "Boîtier SteelBook, artbook, poster \"Iconart\", set de 4 pins." },
  { id: "jp-switch-eow", title: "Echoes of Wisdom", console: "Nintendo Switch", region: "JP", year: 2024, category: "main" },

  { id: "jp-switch2-botw", title: "Breath of the Wild – Nintendo Switch 2 Edition", console: "Nintendo Switch 2", region: "JP", year: 2025, category: "main" },
  { id: "jp-switch2-totk", title: "Tears of the Kingdom – Nintendo Switch 2 Edition", console: "Nintendo Switch 2", region: "JP", year: 2025, category: "main" },
  { id: "jp-switch2-hw-imprisonment", title: "Hyrule Warriors: Age of Imprisonment", console: "Nintendo Switch 2", region: "JP", year: 2025, category: "spinoff" },
  { id: "jp-switch2-hw-imprisonment-treasure", title: "Hyrule Warriors: Age of Imprisonment – Treasure Box", console: "Nintendo Switch 2", region: "JP", year: 2025, category: "edition", notes: "Écharpe, poster tissu, porte-clés Korok en bois, figurines acryliques, pochettes transparentes. Exclusivité japonaise." },
];

export const GAMES: Game[] = [...NA, ...PAL, ...JP];
