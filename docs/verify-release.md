# Vérifier une version Windows

Chaque version publiée possède trois niveaux de vérification complémentaires.

1. La mise à jour automatique Tauri exige une signature cryptographique valide avant l'installation. Cette vérification ne peut pas être désactivée dans l'application.
2. `SHA256SUMS.txt`, joint à chaque version GitHub, permet de comparer localement l'empreinte de l'installateur.
3. GitHub Actions produit une attestation Sigstore qui lie l'installateur au dépôt, au commit et au flux de compilation ayant créé le fichier.

## Vérifier la somme SHA-256

Téléchargez l'installateur et `SHA256SUMS.txt` de la même version, puis exécutez PowerShell dans leur dossier :

```powershell
Get-FileHash -Algorithm SHA256 ".\Zelda.Collection.Checklist_1.0.0_x64-setup.exe"
```

La valeur affichée doit être identique à celle inscrite dans `SHA256SUMS.txt`.

## Vérifier la provenance GitHub

Avec GitHub CLI installé :

```powershell
gh attestation verify ".\Zelda.Collection.Checklist_1.0.0_x64-setup.exe" --repo Icydragon1986/zelda-collection-checklist
```

## Signature Windows Authenticode

La signature des mises à jour Tauri et l'attestation GitHub garantissent l'intégrité et la provenance, mais elles ne remplacent pas un certificat d'identité Authenticode reconnu par Microsoft SmartScreen. Un tel certificat doit être délivré à l'éditeur par une autorité de certification ou un service de signature approuvé; aucune clé factice n'est intégrée au projet. Cette étape pourra être ajoutée au flux GitHub dès qu'un certificat ou un compte de signature Windows sera disponible.
