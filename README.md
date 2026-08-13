# Zelda Collection Checklist

Une application Windows destinée aux collectionneurs de *The Legend of Zelda*.

Elle permet de suivre les jeux, variantes physiques, éditions spéciales, consoles et amiibo d’Amérique du Nord, d’Europe/PAL et du Japon. La collection est enregistrée localement sur l’ordinateur.

## Installation

Téléchargez le fichier `setup.exe` de la [dernière version](https://github.com/icydragon1986/zelda-collection-checklist/releases/latest). L’application vérifie ensuite automatiquement si une nouvelle version est disponible.

Les versions comprennent également des sommes SHA-256 et une attestation de provenance GitHub. Consultez [la procédure de vérification](docs/verify-release.md).

## Fonctions principales

- listes séparées par catégorie et région;
- suivi cartouche/disque, livret, boîte et CIB pour les jeux;
- amiibo en boîte et individuels;
- jaquettes et photos agrandissables;
- remplacement local d’une image;
- sauvegarde persistante de la collection;
- exportation et restauration d'une sauvegarde JSON;
- filtres Possédés, Manquants, CIB et Incomplets;
- visionneuse plein écran pour toutes les images;
- bibliothèque d'images intégrée pour un fonctionnement hors ligne;
- mises à jour automatiques sécurisées et signées.
- tableau de statistiques filtrable par région, catégorie et type de jeu;
- liste des éléments manquants adaptée aux filtres d'analyse;
- checklist imprimable ou enregistrable en PDF;
- registre explicite des visuels officiels encore indisponibles.

## Développement

```sh
npm install
npm run tauri dev
```

Avant une publication, `npm run check` valide automatiquement les identifiants,
les régions, les associations d'images et les ressources locales, puis compile
l'interface.

Pour un ajout futur, `npm run catalog:add -- --help` affiche la commande rapide
qui convertit l'image, ajoute la fiche et relance l'audit automatiquement. Les
exemples complets sont dans [le guide d'ajout](docs/adding-catalog-items.md).

Le catalogue central est exposé par `src/data/catalog.ts`. Ce module regroupe les
trois régions, les amiibo réellement vendus en boîte et la liste des visuels
officiels en attente. En mode développement, l'application signale automatiquement
dans la console les identifiants en double ou les régions invalides.

### Publication Windows

Une modification envoyée sur `main` précompile automatiquement les dépendances
Rust avec `sccache`. Lorsqu'un tag `vX.Y.Z` est ensuite envoyé, GitHub ne fabrique
que l'installateur NSIS utilisé par l'application et son fichier de mise à jour
signé. Le MSI WiX redondant n'est plus construit.

L'installateur NSIS utilise la compression ZLIB, plus rapide à produire que la
compression LZMA, avec une différence de taille minime pour cette application.

La bibliothèque de jaquettes est distribuée comme ressource externe sous
`src-tauri/resources/images`. Elle reste installée localement pour fonctionner
hors ligne, sans être recompilée dans l'exécutable Rust à chaque version.

Les images et marques appartiennent à leurs détenteurs respectifs. Ce projet personnel n’est ni affilié ni approuvé par Nintendo.
