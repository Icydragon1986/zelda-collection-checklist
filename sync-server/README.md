# Triforce Sync Server

Petit serveur personnel de synchronisation pour Triforce Checklist. Il utilise
uniquement Python 3 et SQLite de la bibliothèque standard. Les applications
chiffrent la collection avant l'envoi; le serveur ne conserve qu'un contenu
opaque et un numéro de révision.

## Réseau et isolation

- écoute locale seulement : `127.0.0.1:8788`;
- authentification par jeton aléatoire;
- origines Web explicitement autorisées;
- service Linux dédié `triforce-sync`;
- limites systemd : 80 Mo de mémoire et 25 % d'un cœur;
- aucune dépendance avec TwitchBot et aucun accès à ses fichiers.

Le port local est destiné à être publié en HTTPS par la route Cloudflare
`https://zelda.icydragon1986.com/checklist`. Il ne doit pas être ouvert
directement sur le routeur.

## Tests

```bash
cd sync-server
python3 -m unittest -v
```

## Installation sur le Raspberry Pi

Après avoir copié ce dossier sur le Raspberry Pi :

```bash
cd sync-server
sudo sh install.sh
```

L'installation est réexécutable pour les mises à jour. Elle conserve toujours
le jeton existant et remplace seulement le code et l'unité systemd de
`triforce-sync`. Elle ne modifie ni TwitchBot, ni Cloudflare Tunnel, ni leurs
ports. Vérification locale :

```bash
curl http://127.0.0.1:8788/health
systemctl status triforce-sync
```

La route Cloudflare publique doit conserver le préfixe `/checklist`. Une fois
la route créée, la vérification distante est :

```bash
curl https://zelda.icydragon1986.com/checklist/health
```

Le jeton privé créé à l'installation peut être lu uniquement par un
administrateur :

```bash
sudo cat /etc/triforce-sync/token
```

Il doit être saisi dans l'application Windows au premier réglage, mais ne doit
jamais être ajouté au dépôt Git ou partagé publiquement. L'application crée
ensuite la clé de chiffrement et fournit le code QR privé pour les autres
appareils.
