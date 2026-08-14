# Notes de version

## 1.1.0

- ajout d'une interface française et anglaise avec préférence mémorisée;
- ajout de dix sauvegardes locales automatiques et restaurables, en complément de l'export JSON;
- création automatique d'un point de retour avant chaque modification de la collection;
- ajout d'un bouton pour signaler une erreur, une mauvaise image ou un produit manquant sur GitHub;
- ajout d'un formulaire GitHub bilingue et d'une présentation anglaise du projet;
- préparation facultative de la signature Authenticode dans le workflow de publication;
- documentation du cycle rapide pour les futures additions au catalogue.

## 1.0.1

- correction du chargement intermittent des jaquettes au démarrage de l'application;
- attente du chemin de ressource Tauri avant de créer l'image, ce qui élimine la course avec une URL locale invalide;
- retour automatique à la jaquette du catalogue lorsqu'une image personnalisée n'est plus accessible.

## 1.0.0

- première version officielle de Zelda Collection Checklist;
- ajout des emballages officiels PAL et japonais de l'amiibo Mineru's Construct;
- ajout de variantes physiques et de coffrets régionaux vérifiés pour GameCube, Wii, Nintendo 3DS, Super NES et Nintendo 64;
- reclassement du Zelda Special Value Pak comme ensemble Nintendo 64;
- correction de noms, dates et images de plusieurs éditions japonaises et PAL;
- ajout d'une politique claire : aucune révision de ROM ni édition Not for Resale;
- ajout d'une commande rapide qui traite les images et valide automatiquement les futures fiches;
- publication de sommes SHA-256 et d'attestations de provenance GitHub pour les installateurs;
- audit renforcé contre les identifiants, clés d'image et ressources en double ou manquants.

## 0.9.0

- ajout du logo Triforce dans l'en-tête de l'application;
- ajout de filtres d'analyse par région, catégorie et type de jeu;
- adaptation des statistiques et des listes de manquants aux filtres actifs;
- ajout des visuels distincts de BS Zelda no Densetsu Map 1 et Map 2;
- déplacement de Satellaview après la SNES dans l'ordre des consoles;
- ajout d'un audit automatique du catalogue et des ressources avant publication;
- correction des métadonnées internes de l'application;
- suppression de trois anciennes images amiibo inutilisées.
