# Dépannage upload admin — CFM ASBL

## Mon upload échoue — arbre de décision

1. **Message « Type de fichier non autorisé »**
   - Vérifiez le format : JPG, PNG, WebP, SVG, HEIC, PDF, MP4.
   - Sur iPhone : HEIC est accepté et converti automatiquement en WebP.

2. **Message « Fichier trop volumineux »**
   - Images / PDF : max **20 Mo**.
   - Vidéo : max **50 Mo**.
   - Réduisez la taille ou exportez en JPEG/WebP depuis la galerie.

3. **Message « Upload désactivé sur Netlify démo »**
   - Normal sur l’hébergement démo : le disque n’est pas persistant.
   - Connectez-vous à l’admin sur le **VPS production**.

4. **Message « Échec écriture du fichier » (VPS)**
   - Vérifiez le volume Docker `cfm_media_uploads`.
   - Vérifiez l’espace disque : `df -h`.

5. **Upload OK en admin mais invisible sur le site**
   - **Bibliothèque** : assignez le média via MediaPicker ou Hero/Defaults.
   - **Collections** : les uploads photo/axe sont publiés automatiquement ; les textes alt nécessitent « Enregistrer textes alt collections ».

## Codes d’erreur API

| Code | Signification |
|------|----------------|
| `MIME_REJECTED` | Format non supporté |
| `TOO_LARGE` | Dépassement limite taille |
| `STORAGE_READONLY` | Environnement démo (Netlify) |
| `STORAGE_FAILED` | Problème disque / permissions |
| `CONVERT_FAILED` | Conversion HEIC échouée |
| `INVALID_SETTING_KEY` | Clé setting hero/defaults invalide |

## Vérification rapide (DevTools → Network)

- `POST /api/admin/media` → status **200** avec `{ path, published, warnings }`
- Status **400/503** → lire `error`, `code`, `hint` dans le JSON
