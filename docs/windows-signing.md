# Signature Authenticode Windows

Les mises à jour Tauri sont déjà signées avec `TAURI_SIGNING_PRIVATE_KEY`. Cette
signature protège le mécanisme de mise à jour, mais elle ne remplace pas la
signature Authenticode reconnue par Windows et SmartScreen.

Le workflow de publication prend maintenant en charge Authenticode sans rendre
le certificat obligatoire. Sans certificat, la publication fonctionne exactement
comme avant. Avec les deux secrets ci-dessous, l'exécutable et l'installateur sont
signés automatiquement avec SHA-256 et horodatés.

## Secrets GitHub à ajouter

- `WINDOWS_CERTIFICATE` : contenu Base64 du fichier `.pfx`;
- `WINDOWS_CERTIFICATE_PASSWORD` : mot de passe du fichier `.pfx`.

Conversion locale d'un certificat en Base64 avec PowerShell :

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\Certificats\codesign.pfx")) | Set-Clipboard
```

Ajoutez ensuite la valeur copiée dans **Settings → Secrets and variables →
Actions** du dépôt GitHub. Le certificat est importé uniquement dans le magasin
temporaire du runner de publication, puis retiré à la fin du travail.

## Vérification après publication

Téléchargez l'installateur puis ouvrez ses propriétés Windows. L'onglet
**Signatures numériques** doit afficher le nom légal associé au certificat. Une
signature valide aide SmartScreen, mais la réputation se construit également avec
le temps et le nombre de téléchargements.

Ne placez jamais le fichier `.pfx`, son mot de passe ou sa valeur Base64 dans le
dépôt Git.
