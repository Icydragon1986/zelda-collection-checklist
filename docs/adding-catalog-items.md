# Ajouter rapidement un produit

La commande `npm run catalog:add` ajoute une fiche future sans modifier manuellement les grandes tables TypeScript. Elle convertit la photo en WebP, l'inscrit dans `catalog/catalog-additions.json`, puis exécute l'audit complet. En cas d'erreur, elle annule automatiquement ses changements.

## Exemple : jeu

```powershell
npm run catalog:add -- --kind game --id na-switch2-nouveau-zelda --title "Nouveau Zelda" --console "Nintendo Switch 2" --region NA --year 2027 --category main --image "C:\Images\zelda.jpg" --notes "Sortie physique nord-américaine."
```

## Exemple : console

```powershell
npm run catalog:add -- --kind console --id console-switch2-zelda-na --name "Nintendo Switch 2 – Zelda Edition" --family "Nintendo Switch" --region NA --year 2027 --image "C:\Images\console.png"
```

## Exemple : amiibo et emballages régionaux

```powershell
npm run catalog:add -- --kind amiibo --id amiibo-zelda-exemple --name "Zelda" --series "Tears of the Kingdom" --year 2027 --image "C:\Images\figurine.png" --boxed-na "C:\Images\boite-na.jpg" --boxed-pal "C:\Images\boite-pal.jpg" --boxed-jp "C:\Images\boite-jp.jpg"
```

Utilisez `npm run catalog:add -- --help` pour afficher toutes les options. Une URL HTTPS peut remplacer un chemin local.
